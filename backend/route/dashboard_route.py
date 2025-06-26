from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlalchemy.orm import Session
from sqlalchemy import func
import os

from services.DataBaseConfig import DataBaseConfig
from services.AuthService import AuthService
from db_models import Users, UploadedFiles

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Dependencies
auth_service = AuthService()
db_config = DataBaseConfig()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]
db_dependency = Annotated[Session, Depends(db_config.get_db)]


@dashboard_router.get("/stats")
async def get_dashboard_stats(db: db_dependency, current_user: user_dependency):
    """
    Get dashboard statistics for the current user
    """
    try:
        user_id = current_user.get('user_id')
        
        # Get file count for current user
        file_count = db.query(func.count(UploadedFiles.id)).filter(
            UploadedFiles.user_id == user_id
        ).scalar() or 0
        
        # For now, we'll return mock data for query count and chat sessions
        # These can be implemented when we have proper tracking tables
        stats = {
            "fileCount": file_count,
            "queryCount": 0,  # TODO: Implement query tracking
            "chatSessions": 0,  # TODO: Implement chat session tracking
            "username": current_user.get('user_name'),
            "userId": user_id
        }
        
        return {"success": True, "data": stats}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")
