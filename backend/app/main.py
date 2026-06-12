from fastapi import FastAPI, Depends

from app.database import Base, engine
from app.models import user, event, rsvp
from app.routes import auth
from app.middleware.auth import get_current_user, require_role

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EventHub API",
    version="1.0.0"
)

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Mirësevini në EventHub API!"}


@app.get("/api/protected")
def protected_route(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }


@app.get("/api/attendee")
def attendee_route(
    current_user=Depends(require_role("attendee", "organizer", "admin"))
):
    return {"message": "Attendee access granted"}


@app.get("/api/organizer")
def organizer_route(
    current_user=Depends(require_role("organizer", "admin"))
):
    return {"message": "Organizer access granted"}


@app.get("/api/admin")
def admin_route(
    current_user=Depends(require_role("admin"))
):
    return {"message": "Admin access granted"}