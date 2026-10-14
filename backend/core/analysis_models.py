
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    field_id: Mapped[int | None] = mapped_column(
        ForeignKey("fields.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    crop_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    diseased_crop_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    disease_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    results: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    
    image_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
