import datetime
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now().isoformat())
    citations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional citation details for assistant messages")

class ChatQueryDecision(BaseModel):
    query_type: Literal["greeting", "document_search", "conversation_reference", "off_topic"] = Field(description="Type of query: greeting, document_search, conversation_reference, or off_topic")
    response: str = Field(description="Direct response for greetings, conversation_reference, or off-topic queries")
    follow_up_question: Optional[str] = Field("", description="Reformulated follow-up question for document_search queries")

class ChatInput(BaseModel):
    session_id: Optional[str] = None
    message: str

class ChatCitedAnswer(BaseModel):
    answer: str = Field(description="The answer to the user's latest message with citation markers [0], [1], etc.")

class ChatResponse(BaseModel):
    session_id: str
    answer: str
    citations: List[Dict[str, Any]]
    history: List[ChatMessage]
