from typing import Optional
from pydantic import BaseModel, Field

class UserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    email: str = Field(min_length=3, max_length=50)
    password: str

class UserUpdateRequest(BaseModel):
    username: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    hashed_password: str
