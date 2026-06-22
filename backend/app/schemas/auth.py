from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["attendee", "admin"] = "attendee"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return value


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
