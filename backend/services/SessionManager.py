import uuid
from typing import Dict, List, Optional, Tuple
from schemas.chat_models import ChatMessage

class SessionManager:
    
    def __init__(self):
        # In-memory storage for chat sessions
        # In production, this would be replaced with a database
        self._chat_sessions: Dict[str, Dict] = {}
    
    def create_session(self, user_id: int) -> str:
        session_id = str(uuid.uuid4())
        self._chat_sessions[session_id] = {
            "user_id": user_id,
            "messages": []
        }
        return session_id
    
    def get_session(self, session_id: str) -> Optional[List[ChatMessage]]:
        if session_id in self._chat_sessions:
            return self._chat_sessions[session_id]["messages"]
        return None
    
    def get_session_with_user_id(self, session_id: str) -> Tuple[Optional[List[ChatMessage]], Optional[int]]:
        """Returns both the session messages and user_id associated with the session."""
        if session_id in self._chat_sessions:
            return (self._chat_sessions[session_id]["messages"], 
                    self._chat_sessions[session_id]["user_id"])
        return None, None
    
    def get_active_sessions(self, user_id: int) -> List[str]:
        """Returns a list of active session IDs for the given user."""
        return [session_id for session_id, data in self._chat_sessions.items() 
                if data["user_id"] == user_id and data["messages"]]

    def update_session(self, session_id: str, messages: List[ChatMessage]) -> None:
        # Keep only the last 40 messages (ensures we have enough history)
        if len(messages) > 40:
            messages = messages[-40:]
        
        if session_id in self._chat_sessions:
            self._chat_sessions[session_id]["messages"] = messages
        else:
            # If session doesn't exist, create it with default user_id 0
            self._chat_sessions[session_id] = {
                "user_id": 0,
                "messages": messages
            }
    
    def delete_session(self, session_id: str) -> bool:
        if session_id in self._chat_sessions:
            del self._chat_sessions[session_id]
            return True
        return False
    
    def add_message_to_session(self, session_id: str, message: ChatMessage) -> None:
        if session_id not in self._chat_sessions:
            # Create session with default user_id 0
            self._chat_sessions[session_id] = {
                "user_id": 0,
                "messages": []
            }
        
        self._chat_sessions[session_id]["messages"].append(message)
        
        # Keep only the last 40 messages (ensures we have enough history)
        if len(self._chat_sessions[session_id]["messages"]) > 40:
            self._chat_sessions[session_id]["messages"] = self._chat_sessions[session_id]["messages"][-40:]
