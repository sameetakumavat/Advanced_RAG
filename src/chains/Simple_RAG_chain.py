from typing import Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnableLambda
from schemas.chain import RagInput, CitedAnswer
from prompt import RAG_prompt
from langchain_groq.chat_models import ChatGroq
from initalize_resources import resource_service

chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.2)

def retriever(input: dict) -> str:
    """Retrieve relevant documents based on the input question."""
    question = input["question"]
    docs = resource_service.retriever(question)
    return docs

def get_prompt_template(input: dict) -> str:
    rag_prompt = ChatPromptTemplate.from_template(RAG_prompt)
    return rag_prompt.invoke(input)

_inputs = RunnableParallel(
    {
        "question": lambda x: x.question,
        "word_length": lambda x: x.word_length,
        "context": {"question": lambda x: x.question} | RunnableLambda(retriever),
    }
).with_types(input_type=RagInput)

rag_chain = _inputs | RunnableLambda(get_prompt_template) | chat_model.with_structured_output(CitedAnswer)
