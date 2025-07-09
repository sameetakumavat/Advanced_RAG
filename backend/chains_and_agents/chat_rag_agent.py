import uuid
import re
import logging
from datetime import datetime
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END, START
from langchain_groq.chat_models import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from initalize_resources import resource_service
from schemas.chat_models import ChatMessage, ChatQueryDecision, ChatCitedAnswer
from prompt import CHAT_DECISION_PROMPT, CHAT_ANSWER_PROMPT

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize the LLM
chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.2)

# Define the state schema
class ChatState(TypedDict):
    session_id: str
    message: str
    chat_history: List[ChatMessage]
    document_descriptions: str
    context: str
    answer: str
    citations: List[int]
    action: str
    follow_up_question: str

# Decision node: Determine query type and generate appropriate response or follow-up question
def decision_node(state: ChatState) -> ChatState:
    """
    Classify the message and decide how to respond:
    - For greetings: Provide direct response
    - For document-related questions: Generate follow-up question and route to RAG
    - For off-topic questions: Provide direct response explaining limitations
    - For conversation-reference: Provide summary or response based of previous conversation topics
    """
    logger.info(f"Processing in decision node: session {state['session_id']}")
    
    # Format chat history for context - use last 20 messages for better context
    history = state["chat_history"]
    formatted_history = ""
    if history:
        recent_history = history[-20:] if len(history) > 20 else history
        # Only include role and content in the formatted history, exclude citations details
        formatted_history = "\n".join([f"{msg.role.title()}: {msg.content}" for msg in recent_history])
    
    prompt = ChatPromptTemplate.from_template(CHAT_DECISION_PROMPT)
    structured_chat_model = chat_model.with_structured_output(ChatQueryDecision)
    result = structured_chat_model.invoke(prompt.invoke({
        "message": state["message"], 
        "document_descriptions": state["document_descriptions"],
        "chat_history": formatted_history
    }))
    
    logger.info(f"Message classified as: {result.query_type}")
    
    # Handle based on query type
    if result.query_type in ("greeting", "off_topic", "conversation_reference"):
        # Create user-assistant message for the history
        user_message = ChatMessage(role="user", content=state["message"], timestamp=datetime.now().isoformat())
        assistant_message = ChatMessage(
            role="assistant", 
            content=result.response, 
            timestamp=datetime.now().isoformat(),
            citations=None  # No citations for direct responses
        )
        updated_history = state["chat_history"] + [user_message, assistant_message]
        
        # Limit history size (keep last 40 messages)
        if len(updated_history) > 40:
            updated_history = updated_history[-40:]
        
        return {
            **state,
            "action": "end",
            "answer": result.response,
            "citations": [],
            "chat_history": updated_history,
            "follow_up_question": ""
        }
    else:  # document_search - use RAG system
        # If no follow-up question then use the original message otherwise use the generated one
        if not result.follow_up_question:
            logger.warning("No follow-up question generated, using original message")
            result.follow_up_question = state["message"]
        else:
            logger.info(f"Using enhanced follow-up question: '{result.follow_up_question}'")
            
        logger.info("Routing to retrieve_and_answer node")
        return {
            **state,
            "action": "retrieve_and_answer",
            "follow_up_question": result.follow_up_question
        }

# Retrieve and answer node: Retrieve context and generate answer
def retrieve_and_answer_node(state: ChatState) -> ChatState:
    """Retrieve relevant context and generate an answer."""
    logger.info(f"Processing in retrieve_and_answer node: session {state['session_id']}")
    
    # Use the follow-up question for retrieval if available, otherwise use the original message
    query = state["follow_up_question"] if state["follow_up_question"] else state["message"]
    
    # Log the final query being used for retrieval
    if state["follow_up_question"]:
        logger.info(f"Using follow-up question for retrieval: '{query}'")
    
    try:
        context = resource_service.formatted_retrieve_docs(query, k=3)
        logger.info(f"Retrieved {context.count('Source ID:')} documents")
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        context = f"Error retrieving documents: {str(e)}"
    
    # Format chat history for context - use last 15 messages for RAG context
    history = state["chat_history"]
    formatted_history = ""
    if history:
        recent_history = history[-15:] if len(history) > 15 else history
        # Only include role and content in the formatted history, exclude citations details
        formatted_history = "\n".join([f"{msg.role.title()}: {msg.content}" for msg in recent_history])

    # Invoke the model
    prompt = ChatPromptTemplate.from_template(CHAT_ANSWER_PROMPT)
    structured_chat_model = chat_model.with_structured_output(ChatCitedAnswer)
    response = structured_chat_model.invoke(prompt.invoke({
        "context": context,
        "message": state["message"],
        "chat_history": formatted_history
    }))
    
    # Extract answer and citations
    answer = response.answer
    citation_numbers = [int(num) for num in re.findall(r'\[(\d+)\]', answer)]
    citations = sorted(set(citation_numbers)) if citation_numbers else []
    
    # Get citation metadata for storage
    mapped_citations = []
    if citations:
        try:
            mapped_citations = resource_service.map_citations_to_metadata(citations)
        except Exception as e:
            logger.error(f"Error mapping citations: {str(e)}")
    
    # Store user message and AI response in history
    user_message = ChatMessage(role="user", content=state["message"], timestamp=datetime.now().isoformat())
    assistant_message = ChatMessage(
        role="assistant", 
        content=answer,
        timestamp=datetime.now().isoformat(),
        citations=mapped_citations  # Store citations for UI rendering
    )
    
    updated_history = state["chat_history"] + [user_message, assistant_message]
    
    # Limit history size (keep last 40 messages)
    if len(updated_history) > 40:
        updated_history = updated_history[-40:]
    
    return {
        **state,
        "context": context,
        "answer": answer,
        "citations": citations,
        "chat_history": updated_history,
        "action": "end"
    }

# Router function for conditional edges
def route_next_step(state: ChatState) -> str:
    """Simple router that returns the action from state."""
    return state["action"]

# Build the graph
def build_chat_graph():
    """Build the chat graph with decision and retrieve_and_answer nodes."""
    workflow = StateGraph(ChatState)
    
    # Define nodes
    workflow.add_node("decision", decision_node)
    workflow.add_node("retrieve_and_answer", retrieve_and_answer_node)
    
    # Connect nodes
    workflow.add_edge(START, "decision")
    
    # Add conditional edges from decision node
    workflow.add_conditional_edges("decision", route_next_step, {
        "retrieve_and_answer": "retrieve_and_answer",
        "end": END
    })
    
    # Add edge from retrieve_and_answer to END
    workflow.add_edge("retrieve_and_answer", END)
    
    # Compile the graph
    compiled_graph = workflow.compile()
    return compiled_graph

# API functions
def start_chat_session(user_id: int) -> str:
    """Start a new chat session and return session ID."""
    return str(uuid.uuid4())

def process_chat_message(session_id: str, message: str, chat_history: List[ChatMessage], document_descriptions: str) -> Dict[str, Any]:
    logger.info(f"Processing message for session {session_id}")
    
    # Initialize graph
    graph = build_chat_graph()

    # Create initial state
    state = ChatState(
        session_id=session_id,
        message=message,
        chat_history=chat_history,
        document_descriptions=document_descriptions,
        context="",
        answer="",
        citations=[],
        action="",
        follow_up_question=""
    )
    
    # Run graph
    result = graph.invoke(state)
    
    # Get citation data from the last assistant message (if it exists) from history
    last_message = next((msg for msg in reversed(result["chat_history"]) if msg.role == "assistant"), None)
    citations_for_response = []
    
    if last_message and hasattr(last_message, 'citations') and last_message.citations:
        citations_for_response = last_message.citations
    
    return {
        "session_id": session_id,
        "answer": result["answer"],
        "citations": citations_for_response,
        "history": result["chat_history"]
    }
