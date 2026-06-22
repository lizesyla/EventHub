from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from app.database import get_db
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.user import User
from app.middleware.auth import get_current_user
from app.models.notification import Notification

router = APIRouter(prefix="/api/events", tags=["RSVP"])


@router.post("/{event_id}/rsvp")
def create_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.execute(
        select(Event).where(Event.id == event_id).with_for_update()
    ).scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.status != "upcoming":
        raise HTTPException(status_code=400, detail="This event is not open for RSVPs.")
    if event.organizer_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot RSVP to your own event.")

    existing = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
        RSVP.status == "going"
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="You have already RSVP'd to this event.")

    if event.capacity is not None:
        going_count = db.query(RSVP).filter(
            RSVP.event_id == event_id,
            RSVP.status == "going"
        ).count()

        if going_count >= event.capacity:
            raise HTTPException(status_code=409, detail="This event is fully booked.")

    cancelled = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
        RSVP.status == "cancelled"
    ).first()

    if cancelled:
        cancelled.status = "going"
        cancelled.cancelled_at = None
        db.commit()
        db.refresh(cancelled)
        return {"message": "RSVP confirmed.", "rsvp": cancelled}

    new_rsvp = RSVP(
        event_id=event_id,
        user_id=current_user.id,
        status="going"
    )
    db.add(new_rsvp)

    going_count = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going"
    ).count()

    if going_count in (1, 5, 10, 25, 50, 100, 250, 500):
        notification = Notification(
            user_id=event.organizer_id,
            message=f"Your event '{event.title}' has reached {going_count} RSVPs!",
            type="new_rsvp"
        )
        db.add(notification)

    db.commit()
    db.refresh(new_rsvp)

    return {"message": "RSVP confirmed.", "rsvp": new_rsvp}


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
        raise HTTPException(status_code=404, detail="You don't have an active RSVP for this event.")

    rsvp.status = "cancelled"
    rsvp.cancelled_at = datetime.utcnow()
    db.commit()

    return {"message": "RSVP cancelled successfully."}


@router.get("/{event_id}/rsvp-status")
def get_rsvp_status(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rsvp = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
        RSVP.status == "going"
    ).first()

    return {"has_rsvped": rsvp is not None}


@router.get("/{event_id}/guests")
def get_guest_list(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to view this guest list.")

    rsvps = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going"
    ).all()

    guests = []
    for rsvp in rsvps:
        user = db.query(User).filter(User.id == rsvp.user_id).first()
        if user:
            guests.append({
                "name": user.name,
                "email": user.email,
                "rsvp_date": rsvp.created_at
            })

    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_guests": len(guests),
        "guests": guests
    }