from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.models.user import User
from app.utils.jwt import verify_access_token

bearer_scheme = HTTPBearer()
optional_bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token is missing or invalid.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_access_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if user.role != "admin" and not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated.",
        )

    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None

    try:
        payload = verify_access_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    return db.query(User).filter(User.id == int(user_id)).first()

def require_role(*allowed_roles: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {' or '.join(allowed_roles)}.",
            )
        return current_user
    return role_checker
