from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.event import Event
from app.models.notification import Notification
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def ensure_admin_review_notifications(db: Session, current_user: User) -> None:
    if current_user.role != "admin":
        return

    pending_events = db.query(Event).filter(Event.status == "pending").all()
    created_any = False

    for event in pending_events:
        creator = db.query(User).filter(User.id == event.organizer_id).first()
        notification_type = "event_edited" if event.pending_reason == "edited" else "new_submission"
        if event.pending_reason == "edited":
            message = f"Event '{event.title}' was edited and needs re-approval."
        else:
            creator_name = creator.name if creator else "a user"
            message = f"New event '{event.title}' submitted by {creator_name} is awaiting approval."

        exists = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.type == notification_type,
            Notification.message == message,
        ).first()

        if not exists:
            db.add(Notification(user_id=current_user.id, message=message, type=notification_type))
            created_any = True

    if created_any:
        db.commit()


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_admin_review_notifications(db, current_user)

    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    return [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifications
    ]


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_admin_review_notifications(db, current_user)

    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notification.is_read = True
    db.commit()
    return {"message": "Marked as read."}


@router.patch("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted."}
