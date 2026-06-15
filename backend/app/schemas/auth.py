from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["attendee", "organizer", "admin"] = "attendee"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Fjalëkalimi duhet të ketë të paktën 8 karaktere.")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class AccessTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"