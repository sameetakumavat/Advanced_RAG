from pydantic import BaseModel, Field
from typing import List

class RagInput(BaseModel):
    question: str
    word_length: int = Field(default=150, description="The maximum number of words in the answer.")

class CitedAnswer(BaseModel):
    answer: str = Field(description="The answer to the user question, which is based only on the given source context.")
    citations: List[int] = Field(description="The list of integer IDs of the SPECIFIC source context used while generating the answer to justify.")
