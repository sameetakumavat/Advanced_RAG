import os
import uuid
import re
from datetime import datetime
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_groq.chat_models import ChatGroq
from initalize_resources import resource_service
from schemas.rag_models import ChatMessage

# Initialize the LLM
chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.2)

# Define the state schema
class ChatState(TypedDict):
    session_id: str
    current_message: str
    chat_history: List[ChatMessage]
    follow_up_question: str
    history_summary: str
    context: str
    word_length: int
    answer: str
    citations: List[int]

# First node: Process history and create follow-up question
def summarize_history_node(state: ChatState) -> ChatState:
    """Summarize chat history and create a standalone follow-up question."""
    history = state["chat_history"]
    current_message = state["current_message"]
    
    # If this is the first message, no need to summarize
    if len(history) < 2:  # Less than one full exchange
        return {
            **state,
            "history_summary": "",
            "follow_up_question": current_message
        }
    
    # Get last 10 messages for context (or all if fewer)
    recent_history = history[-10:] if len(history) > 10 else history
    formatted_history = "\n".join([f"{msg.role.title()}: {msg.content}" for msg in recent_history])
    
    summarization_prompt = f"""Based on the conversation history below, please:
    1. Create a comprehensive summary (450-500 words) that captures key points discussed so far
    2. Transform the user's latest question into a standalone, self-contained question that makes sense without conversation context

    Conversation history:
    {formatted_history}

    User's latest question: "{current_message}"

    Format your response exactly as:
    SUMMARY: <comprehensive summary of the conversation>
    STANDALONE QUESTION: <reformulated standalone question>
    """
    
    # Call LLM to get summary and follow-up question
    response = chat_model.invoke(summarization_prompt)
    result = response.content
    
    # Extract summary and follow-up question
    history_summary = ""
    follow_up_question = current_message  # Default to original if extraction fails
    
    if "SUMMARY:" in result and "STANDALONE QUESTION:" in result:
        parts = result.split("STANDALONE QUESTION:")
        summary_part = parts[0].replace("SUMMARY:", "").strip()
        question_part = parts[1].strip()
        
        history_summary = summary_part
        follow_up_question = question_part
    
    return {
        **state,
        "history_summary": history_summary,
        "follow_up_question": follow_up_question
    }

# Second node: Retrieve context and generate answer
def retrieve_and_answer_node(state: ChatState) -> ChatState:
    """Retrieve relevant context and generate an answer."""
    # Use follow-up question for retrieval
    query = state["follow_up_question"]
    
    try:
        # Retrieve relevant docs (2-3)
        context = resource_service.formatted_retrieve_docs(query, k=3)
    except Exception as e:
        context = f"Error retrieving documents: {str(e)}"
    
    # Prepare generation inputs
    original_question = state["current_message"]
    word_length = state["word_length"]
    history_summary = state["history_summary"]
    
    # Build prompt for answer generation
    generation_prompt = f"""You are a helpful document assistant that answers questions based on provided context.
    ### CONVERSATION HISTORY CONTEXT:
    {history_summary}

    ### SOURCE DOCUMENTS:
    {context}

    ### USER QUESTION:
    {original_question}

    ### INSTRUCTIONS:
    1. Answer in approximately {word_length} words
    2. Base your answer ONLY on the information in the provided documents
    3. If you can't answer from the context, say "I don't have enough information to answer that question" without citations
    4. Include citations using [0], [1], etc. format, corresponding to the Source ID in the context
    5. Place citations BEFORE punctuation, like: "France is in Europe [0]."
    6. Do not mention that you're using citations or explain your citation process
    7. Provide a direct, helpful response focused on answering the question
    """
    
    # Call LLM to generate answer
    response = chat_model.invoke(generation_prompt)
    answer = response.content
    
    # Extract citations
    citation_numbers = [int(num) for num in re.findall(r'\[(\d+)\]', answer)]
    citations = sorted(set(citation_numbers)) if citation_numbers else []
    
    # Update chat history
    user_message = ChatMessage(role="user", content=f"Question: {original_question}, Context: {context}", timestamp=datetime.now().isoformat())
    assistant_message = ChatMessage(role="assistant", content=answer, timestamp=datetime.now().isoformat())
    updated_history = state["chat_history"] + [user_message, assistant_message]
    
    # Limit history size (keep last 20 messages)
    if len(updated_history) > 20:
        updated_history = updated_history[-20:]
    
    return {
        **state,
        "context": context,
        "answer": answer,
        "citations": citations,
        "chat_history": updated_history
    }

# Build the graph
def build_chat_graph():
    """Build the chat graph with two main nodes."""
    workflow = StateGraph(ChatState)
    
    # Define nodes
    workflow.add_node("summarize_history", summarize_history_node)
    workflow.add_node("retrieve_and_answer", retrieve_and_answer_node)
    
    # Connect nodes
    workflow.add_edge("summarize_history", "retrieve_and_answer")
    workflow.add_edge("retrieve_and_answer", END)
    
    # Set entry point
    workflow.set_entry_point("summarize_history")
    complied_graph = workflow.compile()
    
    # Save graph workflow image in the png file (one-time setup)
    # os.makedirs("graphs_flows", exist_ok=True)
    # query_graph = complied_graph.get_graph()
    # query_png_path = os.path.join("graphs_flows", "chat_rag_graph.png")
    # with open(query_png_path, "wb") as f:
    #     f.write(query_graph.draw_mermaid_png())
    # print(f"Chat RAG graph visualization saved to {query_png_path}")

    return complied_graph

# API functions
def start_chat_session(user_id: int, word_length: int = 250) -> str:
    """Start a new chat session and return session ID."""
    return str(uuid.uuid4())

def process_chat_message(session_id: str, message: str, chat_history: List[ChatMessage], word_length: int = 250) -> Dict[str, Any]:
    """Process a user message in the chat session."""
    # Initialize graph
    graph = build_chat_graph()
    
    # Create initial state
    state = ChatState(
        session_id=session_id,
        current_message=message,
        chat_history=chat_history,
        follow_up_question="",
        history_summary="",
        context="",
        word_length=word_length,
        answer="",
        citations=[]
    )
    
    # Run graph
    result = graph.invoke(state)
    
    # Map citations to document metadata
    mapped_citations = []
    if result["citations"]:
        mapped_citations = resource_service.map_citations_to_metadata(result["citations"])
    
    return {
        "session_id": session_id,
        "answer": result["answer"],
        "citations": mapped_citations,
        "history": result["chat_history"]
    }
