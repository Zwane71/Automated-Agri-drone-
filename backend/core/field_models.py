
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class Field(Base):
    __tablename__ = "fields"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    farm_id: Mapped[int] = mapped_column(
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    area_hectares: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    crop_type: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    farm = relationship("Farm", back_populates="fields")
