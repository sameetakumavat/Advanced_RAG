from typing import Annotated
import logging
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from chains_and_agents.rag_chain import rag_chain, wikipedia_rag_chain
from schemas.rag_models import RagInput
from initalize_resources import resource_service
from services import AuthService, DataBaseConfig
from route.file_route import get_selected_files, get_document_descriptions
from chains_and_agents.rag_agent import execute_rag_agent

# Set up logger
logger = logging.getLogger(__name__)

# Router and dependencies
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

# Helper functions
def background_initialize_resources(user_id: int, file_paths: list):
    """Background task to initialize RAG resources."""
    global initialization_status
    try:
        initialization_status["status"] = "initializing"
        initialization_status["message"] = "Initializing RAG resources..."
        initialization_status["user_id"] = user_id
        
        resource_service.initialize_resources(selected_file_paths=file_paths)
        
        initialization_status["status"] = "ready"
        initialization_status["message"] = "RAG resources initialized successfully"
        
    except Exception as e:
        initialization_status["status"] = "error"
        initialization_status["message"] = f"Failed to initialize: {str(e)}"
        logger.error(f"Failed to initialize: {str(e)}")


@chain_router.post("/initialize")
def initialize_resource(user: user_dependency, db: db_dependency, background_tasks: BackgroundTasks):
    """Initialize resources using selected files from database in background."""
    global initialization_status
    try:
        user_id = user.get("user_id")
        
        selected_files = get_selected_files(user, db)
        files = selected_files.get("selected_files", [])
        if not files:
            return {"status": "warning", "message": "No files selected. Please select files first."}

        if initialization_status["status"] == "initializing":
            return {
                "status": "info", 
                "message": "Initialization already in progress. Please wait...",
                "initialization_status": initialization_status["status"]
            }

        file_paths = [file["file_path"] for file in files]
        background_tasks.add_task(background_initialize_resources, user_id, file_paths)
        
        return {
            "status": "success", 
            "message": "RAG initialization started in background. Check status for updates.",
            "initialization_status": "initializing"
        }
    except Exception as e:
        logger.error(f"Error initializing resources: {str(e)}")
        initialization_status["status"] = "error"
        initialization_status["message"] = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@chain_router.get("/status")
def get_initialization_status(user: user_dependency):
    """Check if RAG resources are initialized."""
    global initialization_status
    try:
        is_initialized = resource_service.is_initialized()
        
        if is_initialized and initialization_status["status"] != "ready":
            initialization_status["status"] = "ready"
            initialization_status["message"] = "RAG resources are ready"
        
        return {
            "initialized": is_initialized,
            "status": initialization_status["status"],
            "message": initialization_status["message"]
        }
    except Exception as e:
        logger.error(f"Error checking status: {str(e)}")
        return {
            "initialized": False,
            "status": "error",
            "message": str(e)
        }


@chain_router.post("/ask_documents")
def ask_documents(user: user_dependency, input_data: RagInput):
    """Query documents using basic RAG."""
    try:
        response = rag_chain.invoke(input_data)
        mapped_citations = resource_service.map_citations_to_metadata(response.citations)
        
        return {
            "answer": response.answer,
            "citations": mapped_citations
        }
    except Exception as e:
        logger.error(f"Error querying documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@chain_router.post("/ask_wikipedia")
def ask_wikipedia(user: user_dependency, input_data: RagInput):
    """Query Wikipedia using RAG."""
    try:
        response = wikipedia_rag_chain.invoke(input_data)
        mapped_citations = resource_service.map_citations_to_metadata(response.citations)
        
        return {
            "answer": response.answer,
            "citations": mapped_citations
        }
    except Exception as e:
        logger.error(f"Error querying Wikipedia: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@chain_router.post("/ask_rag_agent")
def ask_rag_agent(user: user_dependency, db: db_dependency, input_data: RagInput, use_web_search: bool = True):
    """Execute the RAG agent with optional web search."""
    try:
        doc_descriptions = get_document_descriptions(db)
        
        result = execute_rag_agent(
            question=input_data.question,
            document_descriptions=doc_descriptions,
            word_length=input_data.word_length,
            approve_web_search=use_web_search
        )
        
        return result
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Error in RAG agent: {str(e)}")
        return {
            "completed": False,
            "answer": f"Error processing your question. Please try again.",
            "citations": []
        }
