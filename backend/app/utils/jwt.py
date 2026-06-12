from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

ALGORITHM = "HS256"

def generate_tokens(user_id: int, email: str, role: str) -> dict:
    now = datetime.now(timezone.utc)

    access_payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "type": "access",
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_EXPIRES_MINUTES),
    }

    refresh_payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": now + timedelta(days=settings.JWT_REFRESH_EXPIRES_DAYS),
    }

    access_token = jwt.encode(access_payload, settings.JWT_ACCESS_SECRET, algorithm=ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, settings.JWT_REFRESH_SECRET, algorithm=ALGORITHM)

    return {"access_token": access_token, "refresh_token": refresh_token}

def verify_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[ALGORITHM])

def verify_refresh_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[ALGORITHM])