from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.user import User
from app.middleware.auth import get_current_user
from datetime import datetime
import os
import shutil

router = APIRouter(prefix="/api/events", tags=["Events"])

UPLOAD_DIR = "static/banners"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def ensure_owner(event: Event, current_user: User):
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nuk keni leje për këtë event.")


@router.post("")
async def create_event(
    title: str = Form(...),
    description: str = Form(None),
    location: str = Form(...),
    date_time: str = Form(...),
    capacity: int = Form(None),
    banner: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Vetëm organizer ose admin mund të krijojë event.")

    if len(title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Titulli duhet të ketë së paku 3 karaktere.")

    if not location.strip():
        raise HTTPException(status_code=400, detail="Lokacioni nuk mund të jetë i zbrazët.")

    try:
        event_date = datetime.fromisoformat(date_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formati i datës nuk është i saktë.")

    banner_url = None

    if banner:
        if not banner.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Skedari duhet të jetë imazh.")

        filename = f"{int(datetime.utcnow().timestamp())}_{banner.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(banner.file, buffer)

        banner_url = f"http://localhost:8000/{file_path}"

    db_event = Event(
        title=title,
        description=description,
        location=location,
        date_time=event_date,
        capacity=capacity,
        banner_url=banner_url,
        organizer_id=current_user.id,
        status="upcoming"
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return {"message": "Eventi u krijua me sukses!", "event": db_event}


@router.get("")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()


@router.put("/{event_id}")
def update_event(
    event_id: int,
    title: str = Form(None),
    description: str = Form(None),
    location: str = Form(None),
    date_time: str = Form(None),
    capacity: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    ensure_owner(event, current_user)

    if title is not None:
        if len(title.strip()) < 3:
            raise HTTPException(status_code=400, detail="Titulli duhet të ketë së paku 3 karaktere.")
        event.title = title

    if description is not None:
        event.description = description

    if location is not None:
        if not location.strip():
            raise HTTPException(status_code=400, detail="Lokacioni nuk mund të jetë i zbrazët.")
        event.location = location

    if date_time is not None:
        try:
            event.date_time = datetime.fromisoformat(date_time)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formati i datës nuk është i saktë.")

    if capacity is not None:
        if capacity < 0:
            raise HTTPException(status_code=400, detail="Kapaciteti nuk mund të jetë negativ.")
        event.capacity = capacity

    db.commit()
    db.refresh(event)

    return {"message": "Eventi u përditësua me sukses.", "event": event}


@router.patch("/{event_id}/archive")
def archive_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    ensure_owner(event, current_user)

    event.status = "past"
    db.commit()
    db.refresh(event)

    return {"message": "Eventi u arkivua me sukses.", "event": event}


@router.patch("/{event_id}/cancel")
def cancel_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    ensure_owner(event, current_user)

    event.status = "cancelled"

    db.query(RSVP).filter(RSVP.event_id == event_id).delete()

    db.commit()
    db.refresh(event)

    return {"message": "Eventi u anulua dhe RSVP-të u liruan.", "event": event}