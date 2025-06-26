import re
from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import json
from chains.rag_chain import rag_chain, wikipedia_rag_chain
from schemas.rag_models import RagInput, RagResponse
from initalize_resources import resource_service
from services.AuthService import AuthService
from services.DataBaseConfig import DataBaseConfig
from route.file_route import get_selected_files
from chains.decision_chain import decide_query_path
from chains.rag_agent import run_agent

chain_router = APIRouter(prefix="/chain", tags=["chain"])
auth_service = AuthService()
db_config = DataBaseConfig()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]
db_dependency = Annotated[Session, Depends(db_config.get_db)]

# Global status tracking
initialization_status = {
    "status": "not_initialized",  # not_initialized, initializing, ready, error
    "message": "",
    "user_id": None
}

def background_initialize_resources(user_id: int, file_paths: list):
    """Background task to initialize RAG resources."""
    global initialization_status
    try:
        initialization_status["status"] = "initializing"
        initialization_status["message"] = "Initializing RAG resources..."
        initialization_status["user_id"] = user_id
        
        # Initialize resources with file paths
        response = resource_service.initialize_resources(selected_file_paths=file_paths)
        
        initialization_status["status"] = "ready"
        initialization_status["message"] = "RAG resources initialized successfully"
        
    except Exception as e:
        initialization_status["status"] = "error"
        initialization_status["message"] = f"Failed to initialize: {str(e)}"


@chain_router.post("/initialize")
def initialize_resource(user: user_dependency, db: db_dependency, background_tasks: BackgroundTasks):
    """Initialize resources using selected files from database in background."""
    global initialization_status
    try:
        # Get selected files from database
        selected_files = get_selected_files(user, db)
        files = selected_files.get("selected_files", [])
        if not files:
            return {"status": "warning", "message": "No files selected. Please select files first."}

        # Check if already initializing
        if initialization_status["status"] == "initializing":
            return {
                "status": "info", 
                "message": "Initialization already in progress. Please wait...",
                "initialization_status": initialization_status["status"]
            }

        # Start background initialization
        file_paths = [file["file_path"] for file in files]
        background_tasks.add_task(background_initialize_resources, user.get("user_id"), file_paths)
        
        return {
            "status": "success", 
            "message": "RAG initialization started in background. Check status for updates.",
            "initialization_status": "initializing"
        }
    except Exception as e:
        initialization_status["status"] = "error"
        initialization_status["message"] = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@chain_router.get("/status")
def get_initialization_status(user: user_dependency):
    """Check if RAG resources are initialized."""
    global initialization_status
    try:
        # Check if resources are actually initialized
        is_initialized = resource_service.is_initialized()
        
        # If resources are initialized but status says otherwise, update status
        if is_initialized and initialization_status["status"] != "ready":
            initialization_status["status"] = "ready"
            initialization_status["message"] = "RAG resources are ready"
        
        return {
            "initialized": is_initialized,
            "status": initialization_status["status"],
            "message": initialization_status["message"]
        }
    except Exception as e:
        return {
            "initialized": False,
            "status": "error",
            "message": str(e)
        }


@chain_router.post("/ask_documents")
def ask_documents(user: user_dependency, input_data: RagInput):
    """Perform the RAG operation."""
    try:
        response = rag_chain.invoke(input_data)
        # Map citation IDs to actual document metadata
        mapped_citations = resource_service.map_citations_to_metadata(response.citations)
        return {
            "answer": response.answer,
            "citations": mapped_citations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@chain_router.post("/ask_wikipedia")
def ask_wikipedia(user: user_dependency, input_data: RagInput):
    """Perform the RAG operation via wikipedia."""
    try:
        response = wikipedia_rag_chain.invoke(input_data)
        # Map citation IDs to actual document metadata
        mapped_citations = resource_service.map_citations_to_metadata(response.citations)
        return {
            "answer": response.answer,
            "citations": mapped_citations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# if rag agent doesn't work, use this endpoint
@chain_router.post("/ask_question")
def ask_question(user: user_dependency, db: db_dependency, input_data: RagInput, use_web: bool = False):
    """Perform the RAG operation."""
    try:
        decision = decide_query_path(input_data.question, db)
        if decision["action"] == "direct_response":
            return {"answer": decision["response"], "citations": []}
        elif decision["action"] == "vector_store":
            response = rag_chain.invoke(input_data)
        elif decision["action"] == "wikipedia" and use_web:
            response = wikipedia_rag_chain.invoke(input_data)
        else:
            raise ValueError("Upload a file to use the vector store or enable web search for Wikipedia queries.")
        return RagResponse(answer=response.answer,citations=resource_service.map_citations_to_metadata(response.citations))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@chain_router.post("/ask_rag_agent")
def ask_rag_agent(user: user_dependency, db: db_dependency, input_data: RagInput, use_web: bool = False):
    """Perform the RAG operation using agent."""
    try:
        result = run_agent(
            question=input_data.question,
            db=db,
            word_length=input_data.word_length,
            use_web=use_web
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
