from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    TokenResponse, AccessTokenResponse, UserResponse,
)
from app.utils.password import hash_password, verify_password
from app.utils.jwt import generate_tokens, verify_refresh_token
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email-i është tashmë i regjistruar.")
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="attendee",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Kredenciale të gabuara.")
    tokens = generate_tokens(user.id, user.email, user.role)
    user.refresh_token = tokens["refresh_token"]
    db.commit()
    return {**tokens, "user": user}

@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = verify_refresh_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token i pavlefshëm.")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or user.refresh_token != body.refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token i ripërdorur.")
    tokens = generate_tokens(user.id, user.email, user.role)
    user.refresh_token = tokens["refresh_token"]
    db.commit()
    return tokens

@router.post("/logout", status_code=204)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.refresh_token = None
    db.commit()

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user