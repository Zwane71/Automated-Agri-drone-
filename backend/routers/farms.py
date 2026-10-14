from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from core.database import get_db
from core.dependencies import get_current_user
from core.user_models import User
from core.farm_models import Farm
from core.field_models import Field as FarmField
from core.analysis_models import AnalysisRecord

router = APIRouter(prefix="/api/v1/farms", tags=["Farms"])


class FieldSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_id: int
    name: str
    area_hectares: float | None
    crop_type: str | None
    created_at: datetime


class FarmCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None


class FarmUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = None


class FarmRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str | None
    description: str | None
    created_at: datetime
    fields: list[FieldSummary] = Field(default_factory=list)


def get_owned_farm(
    farm_id: int, user_id: int, db: Session
) -> Farm:
    farm = db.scalar(
        select(Farm)
        .options(selectinload(Farm.fields))
        .where(Farm.id == farm_id, Farm.owner_id == user_id)
    )

    if farm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found.",
        )

    return farm


@router.get("", response_model=list[FarmRead])
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Farm)
        .options(selectinload(Farm.fields))
        .where(Farm.owner_id == current_user.id)
        .order_by(Farm.created_at.desc())
    ).all()


@router.post(
    "",
    response_model=FarmRead,
    status_code=status.HTTP_201_CREATED,
)
def create_farm(
    data: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = Farm(
        owner_id=current_user.id,
        name=data.name.strip(),
        location=data.location,
        description=data.description,
    )

    if not farm.name:
        raise HTTPException(422, "Farm name cannot be empty.")

    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/{farm_id}", response_model=FarmRead)
def get_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_farm(farm_id, current_user.id, db)


@router.patch("/{farm_id}", response_model=FarmRead)
def update_farm(
    farm_id: int,
    data: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = get_owned_farm(farm_id, current_user.id, db)

    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "name":
            value = value.strip()
            if not value:
                raise HTTPException(422, "Farm name cannot be empty.")
        setattr(farm, key, value)

    db.commit()
    db.refresh(farm)
    return get_owned_farm(farm_id, current_user.id, db)


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = get_owned_farm(farm_id, current_user.id, db)

    analysis_count = db.scalar(
        select(func.count(AnalysisRecord.id))
        .join(FarmField, AnalysisRecord.field_id == FarmField.id)
        .where(FarmField.farm_id == farm.id)
    )

    if analysis_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This farm contains fields with saved analyses. "
                "Keep the farm to preserve its history."
            ),
        )

    db.delete(farm)
    db.commit()
