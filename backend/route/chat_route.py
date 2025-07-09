import logging
from datetime import datetime
from typing import Annotated, List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from services import AuthService, DataBaseConfig, SessionManager
from schemas.chat_models import ChatInput, ChatResponse, ChatMessage
from chains_and_agents.chat_rag_agent import start_chat_session, process_chat_message
from route.file_route import get_document_descriptions

# Initialize logger
logger = logging.getLogger(__name__)

chat_router = APIRouter(prefix="/chat", tags=["chat"])
auth_service = AuthService()
db_config = DataBaseConfig()
session_manager = SessionManager()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]
db_dependency = Annotated[Session, Depends(db_config.get_db)]

@chat_router.post("/start", response_model=ChatResponse)
def start_new_chat(user: user_dependency, db: db_dependency):
    """Start a new chat session."""
    user_id = user.get("user_id")
    logger.info(f"Chat session started for user {user_id}")
    
    # Create a new session
    session_id = start_chat_session(user_id)
    
    # Add initial greeting message to session history
    greeting = "Hello! I'm ready to help you with your documents. What would you like to know?"
    assistant_message = ChatMessage(
        role="assistant", 
        content=greeting, 
        timestamp=datetime.now().isoformat(),
        citations=None
    )
    session_id = session_manager.create_session(user_id)
    session_manager.update_session(session_id, [assistant_message])
    
    return ChatResponse(
        session_id=session_id,
        answer=greeting,
        citations=[],
        history=[assistant_message]
    )


@chat_router.get("/get_list_of_active_sessions", response_model=dict)
def get_active_sessions(user: user_dependency):
    """Get a list of active chat sessions for the user."""
    user_id = user.get("user_id")
    logger.info(f"Fetching active sessions for user {user_id}")
    
    active_sessions = session_manager.get_active_sessions(user_id)
    
    if not active_sessions:
        logger.info(f"No active sessions found for user {user_id}")
        return {"message": "No active chat sessions found."}
    
    return {"active_sessions": active_sessions}


@chat_router.post("/message", response_model=ChatResponse)
def send_chat_message(user: user_dependency, db: db_dependency, chat_input: ChatInput):
    """Send a message to an existing chat session."""
    user_id = user.get("user_id")
    session_id = chat_input.session_id
    
    # Check if session exists
    if not session_id or not session_manager.get_session(session_id):
        # Create a new session if needed
        session_id = session_manager.create_session(user_id)
        logger.info(f"New chat session created for user {user_id}")
    
    # Get existing history
    history = session_manager.get_session(session_id) or []
    
    # Get document descriptions
    doc_descriptions = get_document_descriptions(db)
    
    # Process the message
    logger.info(f"Processing message in session {session_id}")
    result = process_chat_message(
        session_id=session_id,
        message=chat_input.message,
        chat_history=history,
        document_descriptions=doc_descriptions
    )
    
    # Update session history
    session_manager.update_session(session_id, result["history"])
    
    return ChatResponse(
        session_id=result["session_id"],
        answer=result["answer"],
        citations=result["citations"],
        history=result["history"]
    )


@chat_router.get("/history/{session_id}", response_model=List[ChatMessage])
def get_chat_history(user: user_dependency, session_id: str):
    """Get the history of a chat session."""
    user_id = user.get("user_id")
    
    history = session_manager.get_session(session_id)
    if not history:
        logger.warning(f"Chat session {session_id} not found")
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return history


@chat_router.delete("/end/{session_id}")
def end_chat_session(user: user_dependency, session_id: str):
    """End a chat session."""
    user_id = user.get("user_id")
    logger.info(f"Ending session {session_id}")
    
    success = session_manager.delete_session(session_id)
    if not success:
        logger.warning(f"Session {session_id} not found when trying to end it")
    
    return {"message": "Chat session ended"}
