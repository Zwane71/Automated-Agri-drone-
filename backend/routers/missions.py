
import calendar
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field as PydanticField
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from core.user_models import User
from core.farm_models import Farm
from core.field_models import Field as FarmField
from core.analysis_models import AnalysisRecord
from core.mission_models import Mission, MissionOccurrence


router = APIRouter(prefix="/api/v1/missions", tags=["Missions"])

RECURRENCE_TYPES = {"once", "daily", "weekly", "fortnightly", "monthly", "custom"}
INTERVAL_UNITS = {"day", "week", "month"}
MISSION_STATUSES = {"active", "cancelled"}
OCCURRENCE_STATUSES = {"pending", "completed", "skipped"}


class MissionCreate(BaseModel):
    field_id: int
    title: str = PydanticField(min_length=1, max_length=200)
    notes: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    recurrence_type: str = "once"
    interval_value: int = PydanticField(default=1, ge=1, le=365)
    interval_unit: str | None = None
    timezone_name: str = PydanticField(default="Africa/Maseru", max_length=64)


class MissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    field_id: int
    title: str
    notes: str | None
    starts_at: datetime
    ends_at: datetime | None
    recurrence_type: str
    interval_value: int
    interval_unit: str | None
    timezone_name: str
    status: str
    created_at: datetime
    updated_at: datetime


class OccurrenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mission_id: int
    occurrence_key: datetime
    scheduled_at: datetime
    status: str
    completed_at: datetime | None
    analysis_record_id: int | None
    created_at: datetime
    updated_at: datetime


class OccurrenceUpdate(BaseModel):
    scheduled_at: datetime | None = None
    status: str | None = None


class CompleteOccurrence(BaseModel):
    analysis_record_id: int


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_datetime(value: datetime) -> datetime:
    """Treat naive timestamps as UTC; convert aware timestamps to UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_owned_field(field_id: int, user_id: int, db: Session) -> FarmField:
    field = db.scalar(
        select(FarmField)
        .join(Farm, FarmField.farm_id == Farm.id)
        .where(FarmField.id == field_id, Farm.owner_id == user_id)
    )
    if field is None:
        raise HTTPException(status_code=404, detail="Field not found.")
    return field


def get_owned_mission(mission_id: int, user_id: int, db: Session) -> Mission:
    mission = db.scalar(
        select(Mission).where(
            Mission.id == mission_id,
            Mission.owner_id == user_id,
        )
    )
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found.")
    return mission


def get_owned_occurrence(
    occurrence_id: int, user_id: int, db: Session
) -> tuple[MissionOccurrence, Mission]:
    row = db.execute(
        select(MissionOccurrence, Mission)
        .join(Mission, MissionOccurrence.mission_id == Mission.id)
        .where(
            MissionOccurrence.id == occurrence_id,
            Mission.owner_id == user_id,
        )
    ).first()

    if row is None:
        raise HTTPException(status_code=404, detail="Occurrence not found.")

    return row[0], row[1]


def add_occurrences(
    db: Session,
    mission: Mission,
    through: datetime,
) -> None:
    """Generate occurrences through a date without duplicating existing ones."""
    start = normalize_datetime(mission.starts_at)
    end = normalize_datetime(mission.ends_at) if mission.ends_at else None
    through = normalize_datetime(through)

    if end is not None:
        through = min(through, end)

    if start > through:
        return

    existing = set(
        db.scalars(
            select(MissionOccurrence.occurrence_key).where(
                MissionOccurrence.mission_id == mission.id
            )
        ).all()
    )

    current = start
    generated = 0

    while current <= through and generated < 1000:
        if current not in existing:
            db.add(
                MissionOccurrence(
                    mission_id=mission.id,
                    occurrence_key=current,
                    scheduled_at=current,
                    status="pending",
                )
            )
            existing.add(current)

        generated += 1

        if mission.recurrence_type == "once":
            break
        elif mission.recurrence_type == "daily":
            current += timedelta(days=1)
        elif mission.recurrence_type == "weekly":
            current += timedelta(weeks=1)
        elif mission.recurrence_type == "fortnightly":
            current += timedelta(weeks=2)
        elif mission.recurrence_type == "monthly":
            month_index = current.month - 1 + 1
            year = current.year + month_index // 12
            month = month_index % 12 + 1
            day = min(current.day, calendar.monthrange(year, month)[1])
            current = current.replace(year=year, month=month, day=day)
        elif mission.recurrence_type == "custom":
            if mission.interval_unit == "day":
                current += timedelta(days=mission.interval_value)
            elif mission.interval_unit == "week":
                current += timedelta(weeks=mission.interval_value)
            elif mission.interval_unit == "month":
                month_index = current.month - 1 + mission.interval_value
                year = current.year + month_index // 12
                month = month_index % 12 + 1
                day = min(current.day, calendar.monthrange(year, month)[1])
                current = current.replace(year=year, month=month, day=day)
            else:
                raise HTTPException(
                    status_code=422,
                    detail="Custom recurrence requires interval_unit: day, week, or month.",
                )
        else:
            raise HTTPException(
                status_code=422,
                detail="Unsupported recurrence type.",
            )


@router.post(
    "",
    response_model=MissionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_mission(
    data: MissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Mission title cannot be empty.")

    if data.recurrence_type not in RECURRENCE_TYPES:
        raise HTTPException(status_code=422, detail="Invalid recurrence type.")

    if data.recurrence_type == "custom":
        if data.interval_unit not in INTERVAL_UNITS:
            raise HTTPException(
                status_code=422,
                detail="Custom recurrence requires interval_unit: day, week, or month.",
            )
    elif data.interval_unit is not None:
        raise HTTPException(
            status_code=422,
            detail="interval_unit is only used for custom recurrence.",
        )

    starts_at = normalize_datetime(data.starts_at)
    ends_at = normalize_datetime(data.ends_at) if data.ends_at else None

    if ends_at is not None and ends_at < starts_at:
        raise HTTPException(
            status_code=422,
            detail="The end date cannot be before the start date.",
        )

    get_owned_field(data.field_id, current_user.id, db)

    mission = Mission(
        owner_id=current_user.id,
        field_id=data.field_id,
        title=title,
        notes=data.notes,
        starts_at=starts_at,
        ends_at=ends_at,
        recurrence_type=data.recurrence_type,
        interval_value=data.interval_value,
        interval_unit=data.interval_unit,
        timezone_name=data.timezone_name,
        status="active",
    )

    db.add(mission)
    db.flush()

    add_occurrences(db, mission, utc_now() + timedelta(days=90))

    db.commit()
    db.refresh(mission)
    return mission


@router.get("", response_model=list[MissionRead])
def list_missions(
    include_cancelled: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Mission).where(Mission.owner_id == current_user.id)

    if not include_cancelled:
        query = query.where(Mission.status == "active")

    missions = db.scalars(query.order_by(Mission.starts_at.asc())).all()

    horizon = utc_now() + timedelta(days=90)
    for mission in missions:
        if mission.status == "active":
            add_occurrences(db, mission, horizon)

    db.commit()
    return missions


@router.get("/occurrences", response_model=list[OccurrenceRead])
def list_occurrences(
    window_days: int = Query(default=90, ge=1, le=365),
    include_completed: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = utc_now()
    horizon = now + timedelta(days=window_days)

    missions = db.scalars(
        select(Mission).where(
            Mission.owner_id == current_user.id,
            Mission.status == "active",
        )
    ).all()

    for mission in missions:
        add_occurrences(db, mission, horizon)

    db.commit()

    query = (
        select(MissionOccurrence)
        .join(Mission, MissionOccurrence.mission_id == Mission.id)
        .where(
            Mission.owner_id == current_user.id,
            MissionOccurrence.scheduled_at <= horizon,
        )
        .order_by(MissionOccurrence.scheduled_at.asc())
    )

    if not include_completed:
        query = query.where(MissionOccurrence.status == "pending")

    return db.scalars(query).all()


@router.patch("/{mission_id}/cancel", response_model=MissionRead)
def cancel_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mission = get_owned_mission(mission_id, current_user.id, db)

    if mission.status != "cancelled":
        mission.status = "cancelled"

        # Preserve completed history; cancel only pending occurrences.
        pending = db.scalars(
            select(MissionOccurrence).where(
                MissionOccurrence.mission_id == mission.id,
                MissionOccurrence.status == "pending",
            )
        ).all()

        for occurrence in pending:
            occurrence.status = "skipped"

        db.commit()
        db.refresh(mission)

    return mission


@router.patch(
    "/occurrences/{occurrence_id}",
    response_model=OccurrenceRead,
)
def update_occurrence(
    occurrence_id: int,
    data: OccurrenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    occurrence, mission = get_owned_occurrence(
        occurrence_id, current_user.id, db
    )

    if occurrence.status == "completed":
        raise HTTPException(
            status_code=409,
            detail="Completed occurrences cannot be edited.",
        )

    changes = data.model_dump(exclude_unset=True)

    if "scheduled_at" in changes and changes["scheduled_at"] is not None:
        occurrence.scheduled_at = normalize_datetime(changes["scheduled_at"])

    if "status" in changes:
        new_status = changes["status"]
        if new_status not in {"pending", "skipped"}:
            raise HTTPException(
                status_code=422,
                detail="Use the completion endpoint to complete an occurrence.",
            )
        occurrence.status = new_status

    db.commit()
    db.refresh(occurrence)
    return occurrence


@router.post(
    "/occurrences/{occurrence_id}/complete",
    response_model=OccurrenceRead,
)
def complete_occurrence(
    occurrence_id: int,
    data: CompleteOccurrence,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    occurrence, mission = get_owned_occurrence(
        occurrence_id, current_user.id, db
    )

    if occurrence.status == "completed":
        raise HTTPException(
            status_code=409,
            detail="This occurrence is already completed.",
        )

    if occurrence.status == "skipped":
        raise HTTPException(
            status_code=409,
            detail="A skipped occurrence cannot be completed.",
        )

    record = db.scalar(
        select(AnalysisRecord).where(
            AnalysisRecord.id == data.analysis_record_id,
            AnalysisRecord.owner_id == current_user.id,
            AnalysisRecord.field_id == mission.field_id,
        )
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Saved analysis not found for this field.",
        )

    occurrence.status = "completed"
    occurrence.completed_at = utc_now()
    occurrence.analysis_record_id = record.id

    db.commit()
    db.refresh(occurrence)
    return occurrence
