from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.middleware.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])

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

# APPROVE organizer
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

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    from app.models.event import Event
    from app.models.rsvp import RSVP

    events = db.query(Event).all()

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

    popular = sorted(turnout, key=lambda x: x["going"], reverse=True)[:5]

    return {
        "turnout": turnout,
        "popular_events": popular
    }
@router.get("/rsvp-trends")
def get_rsvp_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    from app.models.rsvp import RSVP
    from sqlalchemy import func

    results = db.query(
        func.date(RSVP.created_at).label("date"),
        func.count(RSVP.id).label("count")
    ).filter(
        RSVP.status == "going"
    ).group_by(
        func.date(RSVP.created_at)
    ).order_by(
        func.date(RSVP.created_at)
    ).all()

    return [{"date": str(r.date), "count": r.count} for r in results]