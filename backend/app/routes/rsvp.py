from datetime import datetime
import threading

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.event import Event
from app.models.notification import Notification
from app.models.rsvp import RSVP
from app.models.user import User
from app.models.waitlist import Waitlist

router = APIRouter(prefix="/api/events", tags=["Reservations"])

RSVP_MILESTONES = {1, 5, 10, 25, 50, 100, 250, 500}

_reservation_locks: dict[int, threading.Lock] = {}
_reservation_locks_guard = threading.Lock()


def get_reservation_lock(event_id: int) -> threading.Lock:
    with _reservation_locks_guard:
        if event_id not in _reservation_locks:
            _reservation_locks[event_id] = threading.Lock()
        return _reservation_locks[event_id]


def get_going_count(db: Session, event_id: int) -> int:
    return db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going",
    ).count()


def rsvp_count_payload(event: Event, going_count: int) -> dict:
    return {
        "event_id": event.id,
        "spots_taken": going_count,
        "going_count": going_count,
        "capacity": event.capacity,
        "spots_left": None if event.capacity is None else max(event.capacity - going_count, 0),
    }


def fully_booked_response(event: Event, going_count: int) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "detail": "This event is fully booked.",
            "reservation_confirmed": False,
            **rsvp_count_payload(event, going_count),
        },
    )


@router.post("/{event_id}/rsvp")
def create_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "attendee":
        raise HTTPException(status_code=403, detail="Only attendees can reserve a spot.")

    with get_reservation_lock(event_id):
        event = db.execute(
            select(Event).where(Event.id == event_id).with_for_update()
        ).scalar_one_or_none()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found.")
        if event.organizer_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot reserve a spot for your own event.")
        if event.status != "upcoming":
            raise HTTPException(status_code=400, detail="Reservations are only allowed for upcoming events.")

        existing_rsvp = db.query(RSVP).filter(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id,
        ).first()

        if existing_rsvp and existing_rsvp.status == "going":
            raise HTTPException(status_code=409, detail="You have already reserved a spot for this event.")

        current_count = get_going_count(db, event_id)
        if event.capacity is not None and current_count >= event.capacity:
            existing_waitlist = db.query(Waitlist).filter(
                Waitlist.event_id == event_id,
                Waitlist.user_id == current_user.id,
            ).first()

            if existing_waitlist:
                raise HTTPException(status_code=409, detail="You are already on the waitlist for this event.")

            waitlist_entry = Waitlist(
                event_id=event_id,
                user_id=current_user.id,
            )
            db.add(waitlist_entry)
            db.commit()

            waitlist_position = db.query(Waitlist).filter(
                Waitlist.event_id == event_id,
                Waitlist.joined_at <= waitlist_entry.joined_at,
            ).count()

            return JSONResponse(
                status_code=200,
                content={
                    "detail": "This event is fully booked. You have been added to the waitlist.",
                    "waitlist": True,
                    "waitlist_position": waitlist_position,
                    **rsvp_count_payload(event, current_count),
                },
            )

        try:
            if existing_rsvp:
                existing_rsvp.status = "going"
                existing_rsvp.cancelled_at = None
                rsvp = existing_rsvp
            else:
                rsvp = RSVP(
                    event_id=event_id,
                    user_id=current_user.id,
                    status="going",
                )
                db.add(rsvp)

            db.flush()
            new_count = get_going_count(db, event_id)
            if event.capacity is not None and new_count > event.capacity:
                db.rollback()
                return fully_booked_response(event, current_count)

            if new_count in RSVP_MILESTONES:
                db.add(Notification(
                    user_id=event.organizer_id,
                    message=f"Your event '{event.title}' has reached {new_count} reservations.",
                    type="new_rsvp",
                ))

            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="You have already reserved a spot for this event.")

        db.refresh(rsvp)

        return {
            "message": "Reservation confirmed successfully.",
            "reservation_confirmed": True,
            "user_id": current_user.id,
            "rsvp": rsvp,
            **rsvp_count_payload(event, new_count),
        }


@router.delete("/{event_id}/rsvp")
def cancel_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    with get_reservation_lock(event_id):
        rsvp = db.query(RSVP).filter(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id,
            RSVP.status == "going",
        ).first()

        if not rsvp:
            raise HTTPException(status_code=404, detail="No active reservation found for this event.")

        rsvp.status = "cancelled"
        rsvp.cancelled_at = datetime.utcnow()

        db.commit()
        db.refresh(rsvp)

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found.")

        next_in_waitlist = db.query(Waitlist).filter(
            Waitlist.event_id == event_id,
        ).order_by(Waitlist.joined_at.asc()).first()

        if next_in_waitlist:
            existing_rsvp = db.query(RSVP).filter(
                RSVP.event_id == event_id,
                RSVP.user_id == next_in_waitlist.user_id,
            ).first()

            if existing_rsvp:
                existing_rsvp.status = "going"
                existing_rsvp.cancelled_at = None
            else:
                promoted_rsvp = RSVP(
                    event_id=event_id,
                    user_id=next_in_waitlist.user_id,
                    status="going",
                )
                db.add(promoted_rsvp)

            db.add(Notification(
                user_id=next_in_waitlist.user_id,
                message=f"A spot opened up! You have been added to '{event.title}'.",
                type="waitlist_promoted",
            ))
            db.delete(next_in_waitlist)
            db.commit()

        going_count = get_going_count(db, event_id)

        return {
            "message": "Reservation cancelled successfully.",
            "rsvp": rsvp,
            **rsvp_count_payload(event, going_count),
        }


@router.get("/{event_id}/rsvp-count")
def get_rsvp_count(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    return rsvp_count_payload(event, get_going_count(db, event_id))


@router.get("/{event_id}/rsvp-status")
def get_rsvp_status(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rsvp = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.user_id == current_user.id,
        RSVP.status == "going",
    ).first()

    return {"has_rsvped": rsvp is not None}


@router.get("/{event_id}/guests")
def get_guest_list(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view this guest list.")

    rsvps = db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going",
    ).order_by(RSVP.created_at.asc()).all()

    guests = []
    for rsvp in rsvps:
        user = db.query(User).filter(User.id == rsvp.user_id).first()
        if user:
            guests.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "rsvp_date": rsvp.created_at,
            })

    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_guests": len(guests),
        "guests": guests,
    }


@router.get("/{event_id}/waitlist-status")
def get_waitlist_status(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Waitlist).filter(
        Waitlist.event_id == event_id,
        Waitlist.user_id == current_user.id,
    ).first()

    if not entry:
        return {"on_waitlist": False, "waitlist_position": None}

    position = db.query(Waitlist).filter(
        Waitlist.event_id == event_id,
        Waitlist.joined_at <= entry.joined_at,
    ).count()

    return {"on_waitlist": True, "waitlist_position": position}


@router.delete("/{event_id}/waitlist/leave")
def leave_waitlist(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(Waitlist).filter(
        Waitlist.event_id == event_id,
        Waitlist.user_id == current_user.id,
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="You are not on the waitlist for this event.")

    db.delete(entry)
    db.commit()

    return {"message": "You have been removed from the waitlist."}
    