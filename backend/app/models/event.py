from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    location = Column(String)
    date = Column(DateTime)
    banner_url = Column(String, nullable=True)