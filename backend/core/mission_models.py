
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    func,
)

from core.database import Base


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    field_id = Column(
        Integer,
        ForeignKey("fields.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(200), nullable=False)
    notes = Column(Text, nullable=True)

    # once, daily, weekly, monthly, or custom
    recurrence_type = Column(
        String(20),
        nullable=False,
        default="once",
        server_default="once",
    )

    # Example: every 3 days or every 2 weeks.
    interval_value = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    # day, week, or month; null for once.
    interval_unit = Column(String(10), nullable=True)

    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=True)

    timezone_name = Column(
        String(64),
        nullable=False,
        default="Africa/Maseru",
        server_default="Africa/Maseru",
    )

    # active or cancelled
    status = Column(
        String(20),
        nullable=False,
        default="active",
        server_default="active",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("ix_missions_owner_status", "owner_id", "status"),
    )


class MissionOccurrence(Base):
    __tablename__ = "mission_occurrences"

    id = Column(Integer, primary_key=True, index=True)

    mission_id = Column(
        Integer,
        ForeignKey("missions.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Stable identity of the generated occurrence. Keep this unchanged
    # if the user reschedules the occurrence.
    occurrence_key = Column(DateTime(timezone=True), nullable=False)

    # Actual planned date/time; this can be changed for one occurrence.
    scheduled_at = Column(DateTime(timezone=True), nullable=False)

    # pending, completed, or skipped
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    completed_at = Column(DateTime(timezone=True), nullable=True)

    analysis_record_id = Column(
        Integer,
        ForeignKey("analysis_records.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "mission_id",
            "occurrence_key",
            name="uq_mission_occurrence_key",
        ),
        Index(
            "ix_mission_occurrences_status_time",
            "status",
            "scheduled_at",
        ),
    )
