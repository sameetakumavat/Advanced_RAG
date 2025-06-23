import re
from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
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


@chain_router.post("/initialize")
def initialize_resource(user: user_dependency, db: db_dependency):
    """Initialize resources using selected files from database."""
    try:
        # Get selected files from database
        selected_files = get_selected_files(user, db)
        files = selected_files.get("selected_files", [])
        if not files:
            return {"status": "warning", "message": "No files selected. Please select files first."}

        # Initialize resources with file paths for these files
        file_paths = [file["file_path"] for file in files]
        response = resource_service.initialize_resources(selected_file_paths=file_paths)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
