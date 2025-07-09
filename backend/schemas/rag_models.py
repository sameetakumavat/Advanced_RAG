from pydantic import BaseModel, Field
from typing import List, Literal

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
