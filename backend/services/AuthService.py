import os
from datetime import timedelta, datetime, timezone
from typing import Annotated
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

load_dotenv()
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")

class AuthService:
    def __init__(self):
        self.SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        self.ALGORITHM = os.getenv("ALGORITHM")
        self.bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def authenticate_user(self, db: Session, username: str, password: str):
        from db_models import Users  # Importing here to avoid circular import issues
        user = db.query(Users).filter(Users.username == username).first()
        if not user or not self.bcrypt_context.verify(password, user.hashed_password):
            return False
        return user

    def generate_token(self, username: str, user_id: int, email: str, expires_delta: timedelta):
        expires = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": username,
            "user_id": user_id,
            "email": email,
            "expires": expires.isoformat()
        }
        token = jwt.encode(payload, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return token

    async def get_current_user(self, token: Annotated[str, Depends(oauth2_bearer)]):
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=[self.ALGORITHM])
            user_name = payload.get("sub")
            user_id = payload.get("user_id")
            email = payload.get("email")
            if user_name is None or email is None:
                raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            return {"user_name": user_name, "user_id": user_id, "email": email}
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
