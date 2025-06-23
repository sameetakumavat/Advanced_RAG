from langchain_core.prompts import ChatPromptTemplate
from langchain_groq.chat_models import ChatGroq
from sqlalchemy.orm import Session
from prompt import DECISION_PROMPT
from schemas.rag_models import QueryDecision
from initalize_resources import resource_service

# Initialize LLM with structured output
chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.1)
structured_chat_model = chat_model.with_structured_output(QueryDecision)

def get_document_descriptions(db: Session) -> str:
    """Get descriptions of currently selected documents."""
    try:
        from db_models import UploadedFiles
        selected_files = db.query(UploadedFiles).filter(UploadedFiles.is_selected == True).all()
        if selected_files:
            descriptions = []
            for file in selected_files:
                descriptions.append(f"- {file.filename}: {file.description or 'No description available'}")
            return "\n".join(descriptions)
        return "No documents currently selected."
    except Exception as e:
        print(f"Error getting document descriptions: {str(e)}")
        return "Error retrieving document information."

def decide_query_path(question: str, db: Session):
    document_descriptions = get_document_descriptions(db)
    
    # Create prompt and invoke model
    prompt = ChatPromptTemplate.from_template(DECISION_PROMPT)
    result = structured_chat_model.invoke(prompt.invoke({
        "question": question, 
        "document_descriptions": document_descriptions
    }))
    
    # Map query type to action
    action_map = {
        "greeting": "direct_response",
        "document_search": "vector_store",
        "external_knowledge": "wikipedia"
    }
    
    return {
        "action": action_map[result.query_type],
        "response": result.response
    }
