from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import Event
from datetime import datetime
import os
import shutil

router = APIRouter(prefix="/api/events", tags=["Events"])

UPLOAD_DIR = "static/banners"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def create_event(
    title: str = Form(...),
    description: str = Form(None),
    location: str = Form(...),
    date: str = Form(...),
    banner: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if len(title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Titulli duhet të ketë së paku 3 karaktere.")
    if not location.strip():
        raise HTTPException(status_code=400, detail="Lokacioni nuk mund të jetë i zbrazët.")
    
    try:
        event_date = datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formati i datës nuk është i saktë.")

    banner_url = None
    if banner:
        if not banner.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Skedari duhet të jetë imazh (jpg/png).")
        
        filename = f"{int(datetime.utcnow().timestamp())}_{banner.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(banner.file, buffer)
        
        banner_url = f"http://localhost:8000/{file_path}"

    db_event = Event(
        title=title,
        description=description,
        location=location,
        date=event_date,
        banner_url=banner_url
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return {"message": "Eventi u krijua me sukses!", "event": db_event}


@router.get("")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()