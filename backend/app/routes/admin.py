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
    if user.role != "organizer":
        raise HTTPException(status_code=400, detail="Only organizers need approval.")
    user.is_approved = True
    db.commit()
    return {"message": f"{user.name} has been approved as Organizer."}

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