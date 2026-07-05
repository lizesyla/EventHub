from datetime import datetime
import os
import shutil

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.event import Event
from app.models.notification import Notification
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


def notify_admins(db: Session, message: str, notification_type: str):
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        db.add(Notification(
            user_id=admin.id,
            message=message,
            type=notification_type,
        ))


def get_going_count(db: Session, event_id: int) -> int:
    return db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going",
    ).count()


def serialize_event(event: Event, db: Session, current_user: User | None = None) -> dict:
    going_count = get_going_count(db, event.id)
    spots_left = max((event.capacity or 0) - going_count, 0)
    is_full = event.capacity is not None and going_count >= event.capacity
    creator = db.query(User).filter(User.id == event.organizer_id).first()
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
        "creator_id": event.organizer_id,
        "organizer_id": event.organizer_id,
        "creator_name": creator.name if creator else None,
        "creator_email": creator.email if creator else None,
        "pending_reason": event.pending_reason,
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
    capacity: int = Form(...),
    banner: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_title = title.strip()
    clean_location = location.strip()

    if len(clean_title) < 3:
        raise HTTPException(status_code=400, detail="Title must be at least 3 characters.")

    if not clean_location:
        raise HTTPException(status_code=400, detail="Location cannot be empty.")

    try:
        event_date = datetime.fromisoformat(date_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    if capacity < 1:
        raise HTTPException(status_code=400, detail="Capacity must be at least 1.")

    banner_url = None

    if banner and banner.filename:
        if not banner.content_type or not banner.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image.")

        filename = f"{int(datetime.utcnow().timestamp())}_{banner.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(banner.file, buffer)

        banner_url = f"https://eventhub-backend-8gd6.onrender.com/{file_path.replace(os.sep, '/')}"

    status = "upcoming" if current_user.role == "admin" else "pending"
    pending_reason = None if current_user.role == "admin" else "new"

    db_event = Event(
        title=clean_title,
        description=description,
        location=clean_location,
        date_time=event_date,
        capacity=capacity,
        banner_url=banner_url,
        organizer_id=current_user.id,
        status=status,
        pending_reason=pending_reason,
    )

    db.add(db_event)
    db.flush()

    if status == "pending":
        notify_admins(
            db,
            f"New event '{db_event.title}' submitted by {current_user.name} is awaiting approval.",
            "new_submission",
        )

    db.commit()
    db.refresh(db_event)

    return {
        "message": "Event submitted successfully.",
        "event": serialize_event(db_event, db, current_user),
        "review_status": db_event.status,
    }


@router.get("")
def get_events(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    now = datetime.utcnow()
    query = db.query(Event).filter(Event.date_time >= now)
    query = query.filter(Event.status.notin_(["past", "cancelled"]))

    if current_user is None or current_user.role != "admin":
        query = query.filter(Event.status != "pending")

    if current_user is not None and current_user.role != "admin":
        query = query.filter(Event.organizer_id != current_user.id)

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


@router.get("/mine")
def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = db.query(Event).filter(
        Event.organizer_id == current_user.id,
    ).order_by(Event.date_time.desc()).all()

    return [serialize_event(event, db, current_user) for event in events]


@router.patch("/{event_id}/approve")
def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.capacity is None or event.capacity < 1:
        raise HTTPException(status_code=400, detail="Capacity must be at least 1 before approval.")

    event.status = "upcoming"
    event.pending_reason = None
    db.add(Notification(
        user_id=event.organizer_id,
        message=f"Your event '{event.title}' has been approved and is now live.",
        type="approval",
    ))

    db.commit()
    db.refresh(event)

    return {"message": "Event approved successfully.", "event": serialize_event(event, db, current_user)}


@router.patch("/{event_id}/reject")
def reject_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)

    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    event.status = "cancelled"
    event.pending_reason = "rejected"
    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.add(Notification(
        user_id=event.organizer_id,
        message=f"Your event '{event.title}' was rejected by an admin.",
        type="rejection",
    ))

    db.commit()
    db.refresh(event)

    return {"message": "Event rejected successfully.", "event": serialize_event(event, db, current_user)}


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
    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    ensure_owner(event, current_user)
    requires_reapproval = False

    if title is not None:
        clean_title = title.strip()
        if len(clean_title) < 3:
            raise HTTPException(status_code=400, detail="Title must be at least 3 characters.")
        if clean_title != event.title:
            event.title = clean_title
            requires_reapproval = True

    if description is not None and description != event.description:
        event.description = description
        requires_reapproval = True

    if location is not None:
        clean_location = location.strip()
        if not clean_location:
            raise HTTPException(status_code=400, detail="Location cannot be empty.")
        if clean_location != event.location:
            event.location = clean_location
            requires_reapproval = True

    if date_time is not None:
        try:
            new_date = datetime.fromisoformat(date_time)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format.")
        if new_date != event.date_time:
            event.date_time = new_date
            requires_reapproval = True

    if capacity is not None:
        if capacity < 1:
            raise HTTPException(status_code=400, detail="Capacity must be at least 1.")
        going_count = get_going_count(db, event_id)
        if capacity < going_count:
            raise HTTPException(
                status_code=400,
                detail="Capacity cannot be lower than the current reservation count.",
            )
        if capacity != event.capacity:
            event.capacity = capacity
            requires_reapproval = True

    if requires_reapproval and current_user.role != "admin":
        event.status = "pending"
        event.pending_reason = "edited"
        notify_admins(
            db,
            f"Event '{event.title}' was edited by {current_user.name} and needs re-approval.",
            "event_edited",
        )

    db.commit()
    db.refresh(event)

    return {
        "message": "Event updated successfully.",
        "event": serialize_event(event, db, current_user),
        "requires_reapproval": requires_reapproval and current_user.role != "admin",
    }


@router.patch("/{event_id}/archive")
def archive_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    ensure_owner(event, current_user)
    event.status = "past"

    db.commit()
    db.refresh(event)

    return {"message": "Event archived successfully.", "event": serialize_event(event, db, current_user)}


@router.patch("/{event_id}/cancel")
def cancel_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).with_for_update().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if current_user.role != "admin":
        ensure_owner(event, current_user)

    rsvps = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going",
    ).all()

    for rsvp in rsvps:
        db.add(Notification(
            user_id=rsvp.user_id,
            message=f"The event '{event.title}' you reserved has been cancelled.",
            type="cancellation",
        ))

    event.status = "cancelled"
    event.pending_reason = None
    db.query(RSVP).filter(RSVP.event_id == event_id).delete()

    db.commit()
    db.refresh(event)

    return {"message": "Event cancelled and reservations released.", "event": serialize_event(event, db, current_user)}


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

    if event.organizer_id != current_user.id:
        db.add(Notification(
            user_id=event.organizer_id,
            message=f"Your event '{event.title}' was deleted by an admin.",
            type="event_deleted",
        ))

    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully."}
