from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from chains.Simple_RAG_chain import rag_chain
from chains.Wikipedia_RAG_chain import wikipedia_rag_chain
from schemas.chain import RagInput
from initalize_resources import resource_service
from services.AuthService import AuthService

chain_router = APIRouter(prefix="/chain", tags=["chain"])
auth_service = AuthService()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]

@chain_router.post("/initialize")
def initialize_resource(user: user_dependency):
    """Initialize resources."""
    try:
        response = resource_service.initialize_resources(directory_path=resource_service.selected_files_path)
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
