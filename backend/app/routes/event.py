from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.user import User
from app.middleware.auth import get_current_user
from datetime import datetime
from typing import Optional
import os
import shutil

router = APIRouter(prefix="/api/events", tags=["Events"])

UPLOAD_DIR = "static/banners"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def ensure_owner(event: Event, current_user: User):
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nuk keni leje për këtë event.")



@router.get("")
def get_events(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    
    query = db.query(Event).filter(Event.status != "cancelled")

    if search:
        query = query.filter(Event.title.ilike(f"%{search}%"))
    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))

    events = query.order_by(Event.date_time.asc()).all()

    now = datetime.utcnow()
    upcoming = []
    history = []

    for event in events:
        rsvp_count = (
            db.query(func.count(RSVP.id))
            .filter(RSVP.event_id == event.id, RSVP.status == "going")
            .scalar()
        )
        available_spots = (
            (event.capacity - rsvp_count) if event.capacity is not None else None
        )

        event_data = {
            "id": event.id,
            "title": event.title,
            "date_time": event.date_time.isoformat(),
            "location": event.location,
            "banner_url": event.banner_url,
            "status": event.status,
            "capacity": event.capacity,
            "rsvp_count": rsvp_count,
            "available_spots": available_spots,
        }

        if event.date_time >= now and event.status != "past":
            upcoming.append(event_data)
        else:
            history.append(event_data)

    return {"upcoming": upcoming, "history": history}


@router.get("/{event_id}")
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
):
   
   
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    rsvp_count = (
        db.query(func.count(RSVP.id))
        .filter(RSVP.event_id == event_id, RSVP.status == "going")
        .scalar()
    )
    available_spots = (
        (event.capacity - rsvp_count) if event.capacity is not None else None
    )

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "date_time": event.date_time.isoformat(),
        "location": event.location,
        "banner_url": event.banner_url,
        "status": event.status,
        "capacity": event.capacity,
        "organizer_id": event.organizer_id,
        "created_at": event.created_at.isoformat() if event.created_at else None,
        "rsvp_count": rsvp_count,
        "available_spots": available_spots,
        "is_full": event.capacity is not None and rsvp_count >= event.capacity,
        "is_past": event.date_time < datetime.utcnow() or event.status == "past",
    }



@router.post("/{event_id}/rsvp")
def rsvp_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Task 5.1 — Attendee bën RSVP për event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    if event.date_time < datetime.utcnow() or event.status == "past":
        raise HTTPException(status_code=400, detail="Nuk mund të bësh RSVP për event të kaluar.")

    if event.status == "cancelled":
        raise HTTPException(status_code=400, detail="Ky event është anuluar.")

    existing = (
        db.query(RSVP)
        .filter(RSVP.event_id == event_id, RSVP.user_id == current_user.id)
        .first()
    )

    if existing:
        if existing.status == "going":
            raise HTTPException(status_code=400, detail="Ke bërë tashmë RSVP për këtë event.")
        existing.status = "going"
        existing.cancelled_at = None
        db.commit()
        rsvp_count = (
            db.query(func.count(RSVP.id))
            .filter(RSVP.event_id == event_id, RSVP.status == "going")
            .scalar()
        )
        return {"message": "RSVP u riaktivizua me sukses!", "rsvp_count": rsvp_count}

    rsvp_count = (
        db.query(func.count(RSVP.id))
        .filter(RSVP.event_id == event_id, RSVP.status == "going")
        .scalar()
    )
    if event.capacity is not None and rsvp_count >= event.capacity:
        raise HTTPException(status_code=400, detail="Ky event është plotë.")

    new_rsvp = RSVP(event_id=event_id, user_id=current_user.id, status="going")
    db.add(new_rsvp)
    db.commit()

    return {"message": "RSVP u bë me sukses!", "rsvp_count": rsvp_count + 1}



@router.delete("/{event_id}/rsvp")
def cancel_rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Task 5.2 — Attendee anulon RSVP-në e vet."""
    rsvp = (
        db.query(RSVP)
        .filter(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id,
            RSVP.status == "going",
        )
        .first()
    )
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP nuk u gjet.")

    rsvp.status = "cancelled"
    rsvp.cancelled_at = datetime.utcnow()
    db.commit()

    return {"message": "RSVP u anulua me sukses."}


@router.get("/{event_id}/rsvp/me")
def get_my_rsvp_status(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rsvp = (
        db.query(RSVP)
        .filter(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id,
            RSVP.status == "going",
        )
        .first()
    )

    return {"has_rsvp": rsvp is not None}


@router.get("/{event_id}/attendees")
def get_attendees(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Task 5.3 — Organizer/admin sheh listën e attendees."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Eventi nuk u gjet.")

    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Vetëm organizatori ose admin mund të shohë attendees.")

    rsvps = (
        db.query(RSVP, User)
        .join(User, RSVP.user_id == User.id)
        .filter(RSVP.event_id == event_id, RSVP.status == "going")
        .all()
    )

    return {
        "event_id": event_id,
        "total_attendees": len(rsvps),
        "attendees": [
            {
                "user_id": user.id,
                "name": user.name if hasattr(user, "name") else user.email,
                "email": user.email,
                "rsvp_date": rsvp.created_at.isoformat() if rsvp.created_at else None,
            }
            for rsvp, user in rsvps
        ],
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
        status="upcoming",
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return {"message": "Eventi u krijua me sukses!", "event": db_event}


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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
