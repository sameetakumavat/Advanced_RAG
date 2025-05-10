from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from sqlalchemy.orm import Session

from services.DataBaseConfig import DataBaseConfig
from db_models import Users
from services.AuthService import AuthService
from schemas.auth import UserRequest, UserUpdateRequest, UserResponse

class ExceptionCustom(HTTPException):
    pass

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# Initialize AuthService and DataBaseConfig and create dependencies
auth_service = AuthService()
db_config = DataBaseConfig()
db_dependency = Annotated[Session, Depends(db_config.get_db)]


@auth_router.post("/token")
def login_user_for_access_token(db: db_dependency, user: Annotated[OAuth2PasswordRequestForm, Depends()]):
    try:
        user_authenticated = auth_service.authenticate_user(db, user.username, user.password)
        if not user_authenticated:
            raise ExceptionCustom(status_code=401, detail="Invalid username or password")
        token = auth_service.generate_token(user.username, user_authenticated.email, timedelta(minutes=30))
        return {"access_token": token, "token_type": "bearer"}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.post("/create_user")
async def create_user(db: db_dependency, user: UserRequest):
    try:
        user = Users(
            username=user.username,
            email=user.email,
            hashed_password=auth_service.bcrypt_context.hash(user.password),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(user)
        db.commit()
        return {"message": "User created successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.get("/get_all_users")
async def get_all_users(db: db_dependency):
    try:
        users = db.query(Users).all()
        return [UserResponse(**user.to_dict()) for user in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.get("/get_user/{user_id}")
async def get_user_by_id(db: db_dependency, user_id: int):
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise ExceptionCustom(status_code=404, detail="User not found")
        return UserResponse(**user.to_dict())
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.put("/reset_password")  
def reset_password(db: db_dependency, user: UserUpdateRequest):
    try:
        db_user = db.query(Users).filter(Users.username == user.username).first()
        if not db_user:
            raise ExceptionCustom(status_code=404, detail="User not found")

        existing_password = auth_service.bcrypt_context.encrypt(db_user.hashed_password)
        if user.new_password == existing_password:
            raise ExceptionCustom(status_code=400, detail="New password cannot be the same as the old password")
        
        db_user.hashed_password = auth_service.bcrypt_context.hash(user.new_password)
        db_user.updated_at = datetime.now()
        db.add(db_user)
        db.commit()
        return {"message": "New password updated successfully."}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auth_router.delete("/delete_user/{username}")
async def delete_user(db: db_dependency, username: str):
    try:
        user = db.query(Users).filter(Users.username == username).first()
        if not user:
            raise ExceptionCustom(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully."}
    except ExceptionCustom:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
