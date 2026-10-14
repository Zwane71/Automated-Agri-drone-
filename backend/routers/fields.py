from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from core.user_models import User
from core.farm_models import Farm
from core.field_models import Field as FarmField
from core.analysis_models import AnalysisRecord

router = APIRouter(prefix="/api/v1", tags=["Fields"])


class FieldCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    area_hectares: float | None = Field(default=None, gt=0)
    crop_type: str | None = Field(default=None, max_length=100)


class FieldUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    area_hectares: float | None = Field(default=None, gt=0)
    crop_type: str | None = Field(default=None, max_length=100)


class FieldRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    name: str
    area_hectares: float | None
    crop_type: str | None
    created_at: datetime


def get_owned_farm(
    farm_id: int, user_id: int, db: Session
) -> Farm:
    farm = db.scalar(
        select(Farm).where(
            Farm.id == farm_id,
            Farm.owner_id == user_id,
        )
    )
    if farm is None:
        raise HTTPException(404, "Farm not found.")
    return farm


def get_owned_field(
    field_id: int, user_id: int, db: Session
) -> FarmField:
    field = db.scalar(
        select(FarmField)
        .join(Farm, FarmField.farm_id == Farm.id)
        .where(
            FarmField.id == field_id,
            Farm.owner_id == user_id,
        )
    )
    if field is None:
        raise HTTPException(404, "Field not found.")
    return field


@router.get("/farms/{farm_id}/fields", response_model=list[FieldRead])
def list_fields(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_farm(farm_id, current_user.id, db)
    return db.scalars(
        select(FarmField)
        .where(FarmField.farm_id == farm_id)
        .order_by(FarmField.created_at.desc())
    ).all()


@router.post(
    "/farms/{farm_id}/fields",
    response_model=FieldRead,
    status_code=status.HTTP_201_CREATED,
)
def create_field(
    farm_id: int,
    data: FieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_farm(farm_id, current_user.id, db)

    name = data.name.strip()
    if not name:
        raise HTTPException(422, "Field name cannot be empty.")

    field = FarmField(
        farm_id=farm_id,
        name=name,
        area_hectares=data.area_hectares,
        crop_type=data.crop_type,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.get("/fields/{field_id}", response_model=FieldRead)
def get_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_field(field_id, current_user.id, db)


@router.patch("/fields/{field_id}", response_model=FieldRead)
def update_field(
    field_id: int,
    data: FieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_owned_field(field_id, current_user.id, db)

    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "name":
            value = value.strip()
            if not value:
                raise HTTPException(422, "Field name cannot be empty.")
        setattr(field, key, value)

    db.commit()
    db.refresh(field)
    return field


@router.delete(
    "/fields/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    field = get_owned_field(field_id, current_user.id, db)

    analysis_count = db.scalar(
        select(func.count(AnalysisRecord.id)).where(
            AnalysisRecord.field_id == field.id
        )
    )

    if analysis_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This field has saved analyses. "
                "Keep the field to preserve its history."
            ),
        )

    db.delete(field)
    db.commit()
