from langchain_core.prompts import ChatPromptTemplate
from schemas.rag_models import SummarizeAnswer
from prompt import SUMMARIZE_PROMPT
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq.chat_models import ChatGroq
from initalize_resources import resource_service

chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.2)
structured_chat_model= chat_model.with_structured_output(SummarizeAnswer)

def summarize_document(file_path: str, max_pages: int=3):
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    if len(pages)<max_pages:
        max_pages = len(pages)
    pages = pages[:max_pages]
    if not pages:
        return "Document appears to be empty."
    
    # Combine content from pages
    content = "\n\n".join([page.page_content for page in pages])
    
    # Truncate if too long (Groq has context limits)
    if len(content) > 12000:
        content = content[:12000] + "..."

    prompt = ChatPromptTemplate.from_template(SUMMARIZE_PROMPT)
    
    # Summarize using LLM
    response = structured_chat_model.invoke(prompt.invoke({"content": content}))
    return response.summary
