import logging
import os
import sys

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, check_database_connection, engine, get_db
from app.middleware.auth import get_current_user, require_role
from app.models import event, notification, rsvp, user  # noqa: F401
from app.routes import admin, auth, event as event_routes, notifications as notification_routes, profile
from app.routes import rsvp as rsvp_routes

logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("eventhub")

if not settings.is_production:
    Base.metadata.create_all(bind=engine)
else:
    logger.info("Production mode: schema managed by Alembic migrations")

app = FastAPI(
    title="EventHub API",
    version="1.0.0",
)

os.makedirs("static/banners", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )


app.include_router(auth.router)
app.include_router(event_routes.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(rsvp_routes.router)
app.include_router(notification_routes.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to EventHub API!"}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    del db
    try:
        check_database_connection()
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        logger.error("Health check failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"},
        )


@app.get("/api/protected")
def protected_route(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }


@app.get("/api/attendee")
def attendee_route(current_user=Depends(require_role("attendee", "admin"))):
    return {"message": "Attendee access granted"}


@app.get("/api/admin")
def admin_route(current_user=Depends(require_role("admin"))):
    return {"message": "Admin access granted"}
