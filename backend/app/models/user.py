from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role          = Column(String(20), nullable=False, default="attendee")
    is_approved   = Column(Boolean, default=True)  # True për attendee/admin, False për organizer
    refresh_token = Column(Text, nullable=True)
    created_at    = Column(DateTime, server_default=func.now())
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now())