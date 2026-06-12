from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from app.database import Base


class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=True, default="going")
    created_at = Column(DateTime, server_default=func.now())
    cancelled_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_user_event_rsvp"),
    )