from typing import Dict, Any
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from services.DataBaseConfig import Base

class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

    def to_dict(self) -> Dict[Any, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

class UploadedFiles(Base):
    __tablename__ = "uploaded_files"
    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    is_selected = Column(Boolean, default=False)
    description = Column(String, nullable=False)
    upload_date = Column(DateTime, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "filename": self.filename,
            "file_path": self.file_path,
            "is_selected": self.is_selected,
            "description": self.description,
            "upload_date": self.upload_date,
            "user_id": self.user_id
        }
