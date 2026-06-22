from datetime import datetime
import os
import shutil

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.user import User


router = APIRouter(prefix="/api/events", tags=["Events"])

UPLOAD_DIR = "static/banners"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def ensure_owner(event: Event, current_user: User):
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission for this event.")


def ensure_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only.")


def get_going_count(db: Session, event_id: int) -> int:
    return db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going",
    ).count()


def serialize_event(event: Event, db: Session, current_user: User | None = None) -> dict:
    going_count = get_going_count(db, event.id)
    spots_left = None
    is_full = False

    if event.capacity is not None:
        spots_left = max(event.capacity - going_count, 0)
        is_full = going_count >= event.capacity

    organizer = db.query(User).filter(User.id == event.organizer_id).first()
    user_has_rsvped = False

    if current_user:
        user_has_rsvped = db.query(RSVP).filter(
            RSVP.event_id == event.id,
            RSVP.user_id == current_user.id,
            RSVP.status == "going",
        ).first() is not None

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
        "is_full": is_full,
        "user_has_rsvped": user_has_rsvped,
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
    current_user: User = Depends(get_current_user),
):
    if len(title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Title must be at least 3 characters.")

    if not location.strip():
        raise HTTPException(status_code=400, detail="Location cannot be empty.")

    try:
        event_date = datetime.fromisoformat(date_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    banner_url = None

    if banner and banner.filename:
        if not banner.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image.")

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
        status="upcoming" if current_user.role == "admin" else "pending",
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return {
        "message": "Event created successfully.",
        "event": db_event,
        "review_status": db_event.status,
    }


@router.get("")
def get_events(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    query = db.query(Event)

    if current_user is None or current_user.role != "admin":
        query = query.filter(Event.status != "pending")

    events = query.order_by(Event.date_time.asc()).all()
    return [serialize_event(event, db, current_user) for event in events]


@router.get("/history")
def get_event_history(db: Session = Depends(get_db)):
    events = db.query(Event).filter(
        Event.status.in_(["past", "cancelled"])
    ).order_by(Event.date_time.desc()).all()
    return [serialize_event(event, db) for event in events]


@router.get("/my-rsvps")
def get_my_rsvps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "attendee":
        return {"event_ids": []}

    rsvps = db.query(RSVP).filter(
        RSVP.user_id == current_user.id,
        RSVP.status == "going",
    ).all()

    return {"event_ids": [rsvp.event_id for rsvp in rsvps]}


@router.patch("/{event_id}/approve")
def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    event.status = "upcoming"
    db.commit()
    db.refresh(event)

    return {"message": "Event approved successfully.", "event": event}


@router.patch("/{event_id}/reject")
def reject_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    event.status = "cancelled"
    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.commit()
    db.refresh(event)

    return {"message": "Event rejected successfully.", "event": event}


@router.put("/{event_id}")
def update_event(
    event_id: int,
    title: str = Form(None),
    description: str = Form(None),
    location: str = Form(None),
    date_time: str = Form(None),
    capacity: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    ensure_owner(event, current_user)

    if title is not None:
        if len(title.strip()) < 3:
            raise HTTPException(status_code=400, detail="Title must be at least 3 characters.")
        event.title = title

    if description is not None:
        event.description = description

    if location is not None:
        if not location.strip():
            raise HTTPException(status_code=400, detail="Location cannot be empty.")
        event.location = location

    if date_time is not None:
        try:
            event.date_time = datetime.fromisoformat(date_time)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format.")

    if capacity is not None:
        if capacity < 0:
            raise HTTPException(status_code=400, detail="Capacity cannot be negative.")
        event.capacity = capacity

    db.commit()
    db.refresh(event)

    return {"message": "Event updated successfully.", "event": event}


@router.patch("/{event_id}/archive")
def archive_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    ensure_owner(event, current_user)

    event.status = "past"
    db.commit()
    db.refresh(event)

    return {"message": "Event archived successfully.", "event": event}


@router.patch("/{event_id}/cancel")
def cancel_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if current_user.role != "admin":
        ensure_owner(event, current_user)

    event.status = "cancelled"
    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.commit()
    db.refresh(event)

    return {"message": "Event cancelled and RSVPs freed.", "event": event}


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully."}


@router.post("/{event_id}/rsvp")
def rsvp_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "attendee":
        raise HTTPException(status_code=403, detail="Only attendees can RSVP.")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.organizer_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot RSVP to your own event.")

    if event.status != "upcoming":
        raise HTTPException(status_code=400, detail="RSVP is only allowed for upcoming events.")

    existing_rsvp = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
    ).first()

    if existing_rsvp and existing_rsvp.status == "going":
        raise HTTPException(status_code=409, detail="You have already RSVP'd to this event.")

    current_count = get_going_count(db, event_id)

    if event.capacity is not None and current_count >= event.capacity:
        raise HTTPException(status_code=400, detail="This event is full.")

    if existing_rsvp:
        existing_rsvp.status = "going"
        existing_rsvp.cancelled_at = None
        rsvp = existing_rsvp
    else:
        rsvp = RSVP(
            user_id=current_user.id,
            event_id=event_id,
            status="going",
        )
        db.add(rsvp)

    db.commit()
    db.refresh(rsvp)

    spots_taken = current_count + 1
    return {
        "message": "RSVP confirmed successfully.",
        "event_id": event_id,
        "user_id": current_user.id,
        "spots_taken": spots_taken,
        "capacity": event.capacity,
        "spots_left": None if event.capacity is None else max(event.capacity - spots_taken, 0),
    }


@router.delete("/{event_id}/rsvp")
def cancel_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rsvp = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
        RSVP.status == "going",
    ).first()

    if not rsvp:
        raise HTTPException(status_code=404, detail="No active RSVP found for this event.")

    rsvp.status = "cancelled"
    rsvp.cancelled_at = datetime.utcnow()

    db.commit()
    db.refresh(rsvp)

    event = db.query(Event).filter(Event.id == event_id).first()
    going_count = get_going_count(db, event_id)

    return {
        "message": "RSVP cancelled successfully.",
        "event_id": event_id,
        "spots_taken": going_count,
        "capacity": event.capacity if event else None,
        "spots_left": None if not event or event.capacity is None else max(event.capacity - going_count, 0),
    }


@router.get("/{event_id}/rsvp-count")
def get_rsvp_count(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    going_count = get_going_count(db, event_id)

    return {
        "event_id": event_id,
        "going_count": going_count,
        "capacity": event.capacity,
        "spots_left": None if event.capacity is None else max(event.capacity - going_count, 0),
    }
