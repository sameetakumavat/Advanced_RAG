import os
import datetime
from fastapi import APIRouter, BackgroundTasks, UploadFile, HTTPException, Depends
from typing import Annotated, List
from sqlalchemy.orm import Session

from services.AuthService import AuthService
from services.DataBaseConfig import DataBaseConfig
from initalize_resources import resource_service
from db_models import UploadedFiles
from chains.file_summary import summarize_document

file_router = APIRouter(prefix="/files", tags=["files"])
auth_service = AuthService()
db_config = DataBaseConfig()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]
db_dependency = Annotated[Session, Depends(db_config.get_db)]

def generate_and_save_summary(file_path: str, file_id: int, db: Session):
    """Generate summary in background and update database."""
    try:
        # Generate summary
        summary = summarize_document(file_path)
        # Update database with summary
        file_record = db.query(UploadedFiles).filter(UploadedFiles.id == file_id).first()
        if file_record:
            file_record.description = summary
            db.commit()
    except Exception as e:
        print(f"Error in background summary generation: {str(e)}")


@file_router.post("/upload_files")
async def upload_file(user: user_dependency, db: db_dependency, files: List[UploadFile], background_tasks: BackgroundTasks):
    """Upload a file and store record in database."""
    uploaded_files = []
    # Save file to filesystem
    for file in files:
        file_path = os.path.join(resource_service.uploaded_rag_folder_path, file.filename)
        with open(file_path, "wb") as f:
            file_content = await file.read()
            f.write(file_content)
    
        # Add file record to database
        db_file = UploadedFiles(
            filename=file.filename,
            file_path=file_path,
            is_selected=False,
            description="Generating summary...",
            upload_date=datetime.datetime.now(),
            user_id=user.get("user_id")  # Get user ID from token
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Schedule background task to generate summary
        if db_file.id:
            background_tasks.add_task(generate_and_save_summary, file_path=file_path, file_id=db_file.id, db=db)
        else:
            # Update description for non-PDF files
            db_file.description = "File could not be used for summarization."
            db.commit()
        uploaded_files.append(db_file.to_dict())
    
    return {
        "message": f"Files uploaded successfully. Summaries are being generated.",
        "files": uploaded_files
    }


@file_router.get("/list_all_uploaded_files")
def list_files(db: db_dependency, user: user_dependency = None):
    """List all files from database."""
    # Filter files by user ID
    files = db.query(UploadedFiles).filter(UploadedFiles.user_id == user.get("user_id")).all()
    return {"files": [file.to_dict() for file in files]}


@file_router.post("/select_files")
def select_files(user: user_dependency, db: db_dependency, selected_files: List[int]):
    """Select up to 3 files and move them to the selected_files directory."""
    if len(selected_files) > 3:
        raise HTTPException(status_code=400, detail="You can select a maximum of 3 files.")
    
    # First, unselect all files
    db.query(UploadedFiles).update({UploadedFiles.is_selected: False})

    # Then select the specified files
    for file_id in selected_files:
        file = db.query(UploadedFiles).filter(UploadedFiles.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found.")
    
        # Check if this user owns the file
        if file.user_id != user.get("user_id"):
            raise HTTPException(status_code=403, detail="You don't have permission to select this file.")
        
        file.is_selected = True
    db.commit()

    # Get selected files for response
    selected = db.query(UploadedFiles).filter(UploadedFiles.is_selected == True, UploadedFiles.user_id==user.get("user_id")).all()
    return {"message": "Files selected successfully.", "selected_files": [file.to_dict() for file in selected]}


@file_router.get("/selected")
def get_selected_files(user: user_dependency, db: db_dependency):
    """Get all currently selected files."""
    files = db.query(UploadedFiles).filter(UploadedFiles.is_selected == True, UploadedFiles.user_id == user.get("user_id")).all()
    return {"selected_files": [file.to_dict() for file in files]}


@file_router.delete("/{file_id}")
def delete_file(file_id: int, user: user_dependency, db: db_dependency):
    """Delete a file from both filesystem and database."""
    file = db.query(UploadedFiles).filter(UploadedFiles.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found.")
    
    # Validate if user owns this file
    if file.user_id != user.get("user_id"):
        raise HTTPException(status_code=403, detail="You don't have permission to delete this file.")
    
    # Delete from filesystem if file exists
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
    # Delete from database
    db.delete(file)
    db.commit()
    
    return {"message": f"File '{file.filename}' deleted successfully."}
