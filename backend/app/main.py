from fastapi import FastAPI
from app.database import engine
from sqlalchemy import text

app = FastAPI(title="EventHub API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Mirësevini në EventHub API!"}

@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected"
    }