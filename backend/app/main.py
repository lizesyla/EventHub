from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from app.routes import admin

from app.database import Base, engine
from app.models import user, event, rsvp
from app.routes import auth, event as event_routes, profile, admin
from app.middleware.auth import get_current_user, require_role
from app.config import settings


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EventHub API",
    version="1.0.0"
)

os.makedirs("static/banners", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(event_routes.router)
app.include_router(profile.router)
app.include_router(admin.router)

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
    current_user=Depends(require_role("attendee", "admin"))
):
    return {"message": "Attendee access granted"}


@app.get("/api/admin")
def admin_route(current_user=Depends(require_role("admin"))):
    return {"message": "Admin access granted"}