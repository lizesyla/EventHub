from fastapi import FastAPI

from app.database import Base, engine
from app.models import user, event, rsvp
from app.routes import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EventHub API",
    version="1.0.0"
)

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Mirësevini në EventHub API!"}