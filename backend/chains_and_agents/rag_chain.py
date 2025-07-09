import re
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnableLambda
from schemas.rag_models import RagInput, CitedAnswer, RagResponse
from prompt import RAG_PROMPT
from langchain_groq.chat_models import ChatGroq
from initalize_resources import resource_service

chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.2)
structured_chat_model = chat_model.with_structured_output(CitedAnswer)

def vector_store_retriever(input: dict) -> str:
    """Retrieve relevant documents based on the input question."""
    question = input["question"]
    docs = resource_service.formatted_retrieve_docs(question, k=4)
    return docs

def wikipedia_retriever(input: dict) -> str:
    """Retrieve relevant chunks from wikipedia based on the input question."""
    question = input["question"]
    docs = resource_service.wikipedia_retriever(question, k=4)
    return docs

def get_prompt_template(input: dict) -> str:
    rag_prompt = ChatPromptTemplate.from_template(RAG_PROMPT)
    return rag_prompt.invoke(input)

def format_response(llm_response) -> RagResponse:
    """Convert raw text with citations to RagResponse format."""
    citation_numbers = [int(num) for num in re.findall(r'\[(\d+)\]', llm_response.answer)]
    return RagResponse(
        answer=llm_response.answer,
        citations=sorted(set(citation_numbers)) if citation_numbers else [])

def build_rag_chain(retriever_func):
    _inputs = RunnableParallel(
        {
            "question": lambda x: x.question,
            "word_length": lambda x: x.word_length,
            "context": {"question": lambda x: x.question} | RunnableLambda(retriever_func),
        }
    ).with_types(input_type=RagInput)
    chain = _inputs | RunnableLambda(get_prompt_template) | structured_chat_model | RunnableLambda(format_response)
    return chain

rag_chain = build_rag_chain(vector_store_retriever)
wikipedia_rag_chain = build_rag_chain(wikipedia_retriever)
