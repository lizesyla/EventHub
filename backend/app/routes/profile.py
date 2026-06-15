from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ProfileUpdate(BaseModel):
    name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@router.put("/me")
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.name = data.name
    db.commit()
    db.refresh(current_user)
    return {"message": "Profili u azhurnua", "name": current_user.name}

@router.put("/me/password")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not pwd_context.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Fjalëkalimi aktual është i gabuar")
    
    current_user.password_hash = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Fjalëkalimi u ndryshua me sukses"}