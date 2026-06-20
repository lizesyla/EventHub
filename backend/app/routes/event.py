from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.user import User
from app.middleware.auth import get_current_user, get_current_user_optional
from datetime import datetime
import os
import shutil

router = APIRouter(prefix="/api/events", tags=["Events"])

UPLOAD_DIR = "static/banners"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def ensure_owner(event: Event, current_user: User):
    if event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission for this event.")


def ensure_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only.")


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

    status = "upcoming" if current_user.role == "admin" else "pending"
    reason = None if current_user.role == "admin" else "new"

    db_event = Event(
        title=title,
        description=description,
        location=location,
        date_time=event_date,
        capacity=capacity,
        banner_url=banner_url,
        organizer_id=current_user.id,
        status=status,
        pending_reason=reason
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return {
        "message": "Event created successfully!",
        "event": db_event,
        "review_status": status,
    }


@router.get("")
def get_events(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    now = datetime.utcnow()
    query = db.query(Event)

    if current_user is None or current_user.role != "admin":
        query = query.filter(Event.status != "pending")

    query = query.filter(Event.date_time >= now)
    query = query.filter(Event.status.notin_(["past", "cancelled"]))

    if current_user:
        query = query.filter(Event.organizer_id != current_user.id)

    events = query.order_by(Event.date_time.asc()).all()

    result = []
    for event in events:
        going_count = db.query(RSVP).filter(
            RSVP.event_id == event.id,
            RSVP.status == "going"
        ).count()

        spots_left = None
        is_full = False
        if event.capacity is not None:
            spots_left = max(event.capacity - going_count, 0)
            is_full = going_count >= event.capacity

        user_has_rsvped = False
        if current_user:
            existing = db.query(RSVP).filter(
                RSVP.event_id == event.id,
                RSVP.user_id == current_user.id,
                RSVP.status == "going"
            ).first()
            user_has_rsvped = existing is not None

        result.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "date_time": event.date_time,
            "location": event.location,
            "capacity": event.capacity,
            "banner_url": event.banner_url,
            "status": event.status,
            "organizer_id": event.organizer_id,
            "going_count": going_count,
            "spots_left": spots_left,
            "is_full": is_full,
            "user_has_rsvped": user_has_rsvped,
            "pending_reason": event.pending_reason,
        })

    return result


@router.get("/mine")
def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    events = db.query(Event).filter(
        Event.organizer_id == current_user.id
    ).order_by(Event.date_time.desc()).all()

    result = []
    for event in events:
        going_count = db.query(RSVP).filter(
            RSVP.event_id == event.id,
            RSVP.status == "going"
        ).count()
        result.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "date_time": event.date_time,
            "location": event.location,
            "capacity": event.capacity,
            "banner_url": event.banner_url,
            "status": event.status,
            "organizer_id": event.organizer_id,
            "going_count": going_count,
        })
    return result
@router.get("/mine/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    events = db.query(Event).filter(
        Event.organizer_id == current_user.id
    ).all()

    turnout = []
    for event in events:
        going_count = db.query(RSVP).filter(
            RSVP.event_id == event.id,
            RSVP.status == "going"
        ).count()
        turnout.append({
            "title": event.title,
            "going": going_count,
            "capacity": event.capacity or 0
        })

    popular = sorted(turnout, key=lambda x: x["going"], reverse=True)[:3]
    total_rsvps = sum(t["going"] for t in turnout)

    return {
        "turnout": turnout,
        "popular_events": popular,
        "total_rsvps": total_rsvps,
        "total_events": len(events)
    }


@router.get("/history")
def get_event_history(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(Event).filter(
        (Event.status.in_(["past", "cancelled"])) | (Event.date_time < now)
    ).order_by(Event.date_time.desc()).all()


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
    event.pending_reason = None
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

    return {"message": "Event rejected.", "event": event}


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
        raise HTTPException(status_code=404, detail="Event not found.")

    ensure_owner(event, current_user)

    requires_reapproval = False

    if title is not None:
        if len(title.strip()) < 3:
            raise HTTPException(status_code=400, detail="Title must be at least 3 characters.")
        event.title = title

    if description is not None:
        event.description = description

    if location is not None:
        if not location.strip():
            raise HTTPException(status_code=400, detail="Location cannot be empty.")
        if location != event.location:
            requires_reapproval = True
        event.location = location

    if date_time is not None:
        try:
            new_date = datetime.fromisoformat(date_time)
            if new_date != event.date_time:
                requires_reapproval = True
            event.date_time = new_date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format.")

    if capacity is not None:
        if capacity < 0:
            raise HTTPException(status_code=400, detail="Capacity cannot be negative.")
        if capacity != event.capacity:
            requires_reapproval = True
        event.capacity = capacity

    if requires_reapproval and current_user.role != "admin":
        event.status = "pending"
        event.pending_reason = "edited"

    db.commit()
    db.refresh(event)

    return {
        "message": "Event updated successfully." + (
            " It has been sent for re-approval." if requires_reapproval and current_user.role != "admin" else ""
        ),
        "event": event,
        "requires_reapproval": requires_reapproval
    }


@router.patch("/{event_id}/archive")
def archive_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    db.query(RSVP).filter(RSVP.event_id == event_id).delete()
    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully."}