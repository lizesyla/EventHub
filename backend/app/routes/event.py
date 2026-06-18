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


def get_going_count(db: Session, event_id: int) -> int:
    return db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going"
    ).count()


def serialize_event(event: Event, db: Session) -> dict:
    going_count = get_going_count(db, event.id)
    spots_left = None if event.capacity is None else max(event.capacity - going_count, 0)
    organizer = db.query(User).filter(User.id == event.organizer_id).first()

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "date_time": event.date_time,
        "location": event.location,
        "capacity": event.capacity,
        "banner_url": event.banner_url,
        "status": event.status,
        "organizer_id": event.organizer_id,
        "organizer_name": organizer.name if organizer else None,
        "organizer_email": organizer.email if organizer else None,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "going_count": going_count,
        "spots_left": spots_left,
    }


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
    events = db.query(Event).all()
    return [serialize_event(event, db) for event in events]


@router.get("/history")
def get_event_history(db: Session = Depends(get_db)):
    events = db.query(Event).filter(
        Event.status.in_(["past", "cancelled"])
    ).all()
    return [serialize_event(event, db) for event in events]


@router.get("/my-rsvps")
def get_my_rsvps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "attendee":
        return {"event_ids": []}

    rsvps = db.query(RSVP).filter(
        RSVP.user_id == current_user.id,
        RSVP.status == "going"
    ).all()

    return {"event_ids": [rsvp.event_id for rsvp in rsvps]}

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

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    ensure_owner(event, current_user)

    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.delete(event)
    db.commit()

    return {"message": "Eventi u fshi me sukses."}


@router.post("/{event_id}/rsvp")
def rsvp_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "attendee":
        raise HTTPException(status_code=403, detail="Vetëm attendee mund të bëjë RSVP.")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    if event.status != "upcoming":
        raise HTTPException(status_code=400, detail="RSVP lejohet vetëm për evente upcoming.")

    existing_rsvp = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id
    ).first()

    if existing_rsvp and existing_rsvp.status == "going":
        raise HTTPException(status_code=409, detail="Ju tashmë keni bërë RSVP për këtë event.")

    current_count = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going"
    ).count()

    if event.capacity is not None and current_count >= event.capacity:
        raise HTTPException(status_code=400, detail="Eventi është full. Nuk ka vende të lira.")

    if existing_rsvp:
        existing_rsvp.status = "going"
        existing_rsvp.cancelled_at = None
        rsvp = existing_rsvp
    else:
        rsvp = RSVP(
            user_id=current_user.id,
            event_id=event_id,
            status="going"
        )
        db.add(rsvp)

    db.commit()
    db.refresh(rsvp)

    return {
        "message": "RSVP u krye me sukses.",
        "event_id": event_id,
        "user_id": current_user.id,
        "spots_taken": current_count + 1,
        "capacity": event.capacity,
        "spots_left": None if event.capacity is None else max(event.capacity - (current_count + 1), 0)
    }


@router.delete("/{event_id}/rsvp")
def cancel_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rsvp = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
        RSVP.status == "going"
    ).first()

    if not rsvp:
        raise HTTPException(status_code=404, detail="Nuk u gjet RSVP aktive për këtë event.")

    rsvp.status = "cancelled"
    rsvp.cancelled_at = datetime.utcnow()

    db.commit()
    db.refresh(rsvp)

    event = db.query(Event).filter(Event.id == event_id).first()
    going_count = get_going_count(db, event_id)

    return {
        "message": "RSVP u anulua me sukses.",
        "event_id": event_id,
        "spots_taken": going_count,
        "capacity": event.capacity if event else None,
        "spots_left": None if not event or event.capacity is None else max(event.capacity - going_count, 0)
    }


@router.get("/{event_id}/rsvp-count")
def get_rsvp_count(
    event_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    going_count = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going"
    ).count()

    return {
        "event_id": event_id,
        "going_count": going_count,
        "capacity": event.capacity,
        "spots_left": None if event.capacity is None else event.capacity - going_count
    }
