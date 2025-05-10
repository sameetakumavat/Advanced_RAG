import os
import shutil
from fastapi import APIRouter, UploadFile, HTTPException, Depends
from typing import Annotated, List
from services.AuthService import AuthService
from initalize_resources import resource_service

file_router = APIRouter(prefix="/files", tags=["files"])
auth_service = AuthService()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]

# Ensure directories exist
RAG_FILES_DIR = resource_service.uploaded_rag_folder_path
SELECTED_FILES_DIR = resource_service.selected_files_path
os.makedirs(RAG_FILES_DIR, exist_ok=True)
os.makedirs(SELECTED_FILES_DIR, exist_ok=True)

@file_router.post("/upload")
async def upload_file(user: user_dependency, file: UploadFile):
    """Upload a file to the rag_files directory."""
    file_path = os.path.join(RAG_FILES_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"message": f"File '{file.filename}' uploaded successfully."}

@file_router.get("/list")
def list_files():
    """List all files in the rag_files directory."""
    files = os.listdir(RAG_FILES_DIR)
    return {"files": files}

@file_router.post("/select")
def select_files(user: user_dependency, selected_files: List[str]):
    """Select up to 3 files and move them to the selected_files directory."""
    if len(selected_files) > 3:
        raise HTTPException(status_code=400, detail="You can select a maximum of 3 files.")
    
    # Clear the selected_files directory
    for file in os.listdir(SELECTED_FILES_DIR):
        os.remove(os.path.join(SELECTED_FILES_DIR, file))
    
    # Move selected files
    for file_name in selected_files:
        source_path = os.path.join(RAG_FILES_DIR, file_name)
        if not os.path.exists(source_path):
            raise HTTPException(status_code=404, detail=f"File '{file_name}' not found.")
        destination_path = os.path.join(SELECTED_FILES_DIR, file_name)
        shutil.copy(source_path, destination_path)
    
    return {"message": "Files selected successfully.", "selected_files": selected_files}
