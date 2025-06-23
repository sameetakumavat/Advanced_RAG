from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated, Dict, List
from sqlalchemy.orm import Session
from services.AuthService import AuthService
from services.DataBaseConfig import DataBaseConfig
from schemas.rag_models import ChatInput, ChatResponse, ChatMessage
from chains.chat_rag_agent import start_chat_session, process_chat_message

chat_router = APIRouter(prefix="/chat", tags=["chat"])
auth_service = AuthService()
db_config = DataBaseConfig()
user_dependency = Annotated[dict, Depends(auth_service.get_current_user)]
db_dependency = Annotated[Session, Depends(db_config.get_db)]

# In-memory storage for chat sessions (in production, use a database)
chat_sessions: Dict[str, List[ChatMessage]] = {}

@chat_router.post("/start", response_model=ChatResponse)
def start_new_chat(user: user_dependency, db: db_dependency):
    """Start a new chat session."""
    user_id = user.get("user_id")
    # Create a new session
    session_id = start_chat_session(user_id)
    chat_sessions[session_id] = []
    
    return ChatResponse(
        session_id=session_id,
        answer="Hello! I'm ready to help you with your documents. What would you like to know?",
        citations=[],
        history=[]
    )

@chat_router.post("/message", response_model=ChatResponse)
def send_chat_message(user: user_dependency, chat_input: ChatInput):
    """Send a message to an existing chat session."""
    session_id = chat_input.session_id
    
    # Check if session exists
    if not session_id or session_id not in chat_sessions:
        # Create a new session if needed
        session_id = start_chat_session(user.get("user_id"))
        chat_sessions[session_id] = []
    
    # Get existing history
    history = chat_sessions.get(session_id, [])
    
    # Process the message
    result = process_chat_message(
        session_id=session_id,
        message=chat_input.message,
        chat_history=history,
        word_length=chat_input.word_length
    )
    
    # Update session history
    chat_sessions[session_id] = result["history"]
    
    return ChatResponse(
        session_id=result["session_id"],
        answer=result["answer"],
        citations=result["citations"],
        history=result["history"]
    )

@chat_router.get("/history/{session_id}", response_model=List[ChatMessage])
def get_chat_history(user: user_dependency, session_id: str):
    """Get the history of a chat session."""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return chat_sessions[session_id]

@chat_router.delete("/end/{session_id}")
def end_chat_session(user: user_dependency, session_id: str):
    """End a chat session."""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    
    return {"message": "Chat session ended"}
