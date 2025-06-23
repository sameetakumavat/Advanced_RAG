import datetime
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional

class SummarizeAnswer(BaseModel):
    summary: str = Field(description="2-3 line descriptive summary of the given document content.")

class QueryDecision(BaseModel):
    query_type: Literal["greeting", "document_search", "external_knowledge"] = Field(description="Type of query: greeting, document_search, or external_knowledge")
    response: str = Field(description="Direct response for greetings only")

class RagInput(BaseModel):
    question: str
    word_length: int = 250

class RagResponse(BaseModel):
    answer: str
    citations: List[int] = []

class CitedAnswer(BaseModel):
    answer: str = Field(description="The answer to the user's question with citation markers [0], [1], etc.")

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now().isoformat())

class ChatInput(BaseModel):
    session_id: Optional[str] = None
    message: str
    word_length: int = 250

class ChatResponse(BaseModel):
    session_id: str
    answer: str
    citations: List[Dict[str, Any]]
    history: List[ChatMessage]
