from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import Event
from app.models.rsvp import RSVP
from app.models.user import User
from app.middleware.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def going_count(db: Session, event_id: int) -> int:
    return db.query(RSVP).filter(
        RSVP.event_id == event_id,
        RSVP.status == "going",
    ).count()


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    events = db.query(Event).order_by(Event.date_time.asc()).all()
    turnout = [
        {
            "id": event.id,
            "title": event.title,
            "going": going_count(db, event.id),
            "capacity": event.capacity,
        }
        for event in events
    ]

    popular_events = sorted(turnout, key=lambda event: event["going"], reverse=True)[:5]
    return {"turnout": turnout, "popular_events": popular_events}


@router.get("/rsvp-trends")
def get_reservation_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    rows = db.query(
        func.date(RSVP.created_at).label("date"),
        func.count(RSVP.id).label("count"),
    ).filter(
        RSVP.status == "going",
    ).group_by(
        func.date(RSVP.created_at),
    ).order_by(
        func.date(RSVP.created_at),
    ).all()

    return [{"date": str(row.date), "count": row.count} for row in rows]

# GET all users
@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_approved": u.is_approved,
            "created_at": str(u.created_at),
        }
        for u in users
    ]

# ACTIVATE user
@router.patch("/users/{user_id}/approve")
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot modify an admin.")
    user.is_approved = True
    db.commit()
    return {"message": f"{user.name} has been activated."}

# DEACTIVATE user
@router.patch("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot deactivate an admin.")
    user.is_approved = False
    db.commit()
    return {"message": f"{user.name} has been deactivated."}
