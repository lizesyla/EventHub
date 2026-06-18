from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    date_time = Column(DateTime, nullable=False)
    location = Column(String(150), nullable=False)
    capacity = Column(Integer, nullable=True)
    banner_url = Column(Text, nullable=True)
    status = Column(String(20), nullable=True, default="upcoming")
    organizer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    
