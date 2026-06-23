from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.utils.jwt import generate_tokens, verify_refresh_token
from app.utils.password import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email is already registered.")

    user = User(
        name=body.name.strip(),
        email=body.email,
        password_hash=hash_password(body.password),
        role="attendee",
        is_approved=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if user.role != "admin" and not user.is_approved:
        raise HTTPException(status_code=403, detail="Your account is deactivated.")

    tokens = generate_tokens(user.id, user.email, user.role)
    user.refresh_token = tokens["refresh_token"]
    db.commit()
    return {**tokens, "user": user}


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = verify_refresh_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or user.refresh_token != body.refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token already used.")
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
