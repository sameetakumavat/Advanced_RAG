import os
import re
from typing import TypedDict, List, Dict, Any
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END
from chains.rag_chain import rag_chain, wikipedia_rag_chain
from chains.decision_chain import decide_query_path
from initalize_resources import resource_service
from schemas.rag_models import RagInput, RagResponse

# Define the state for our graph
class QueryState(TypedDict):
    question: str
    word_length: int
    action: str  # "direct_response", "vector_store", or "wikipedia"
    response: str
    answer: str
    citations: List[int]
    use_web: bool
    db: Session

# Node 1: Decision node to determine query path
def decision_node(state: QueryState) -> QueryState:
    """Determine the best path for answering the query."""
    question = state["question"]
    db = state["db"]
    
    decision = decide_query_path(question, db)
    
    return {
        **state,
        "action": decision["action"],
        "response": decision.get("response", "")
    }

# Node 2: Direct response node (for greetings, etc.)
def direct_response_node(state: QueryState) -> QueryState:
    """Return a direct response without retrieval."""
    # The response is already in state from the decision node
    return {
        **state,
        "answer": state["response"],
        "citations": []
    }

# Node 3: Vector store retrieval node
def vector_store_node(state: QueryState) -> QueryState:
    """Retrieve from vector store and generate an answer."""
    question = state["question"]
    word_length = state["word_length"]
    
    # Create input for rag_chain
    input_data = RagInput(question=question, word_length=word_length)
    
    # Invoke rag_chain
    response = rag_chain.invoke(input_data)
    
    return {
        **state,
        "answer": response.answer,
        "citations": response.citations
    }

# Node 4: Wikipedia retrieval node
def wikipedia_node(state: QueryState) -> QueryState:
    """Retrieve from Wikipedia and generate an answer."""
    # Only proceed if web search is enabled
    if not state["use_web"]:
        return {
            **state,
            "answer": "Web search is disabled. Please enable it to search Wikipedia.",
            "citations": []
        }
    
    question = state["question"]
    word_length = state["word_length"]
    
    # Create input for wikipedia_rag_chain
    input_data = RagInput(question=question, word_length=word_length)
    
    # Invoke wikipedia_rag_chain
    response = wikipedia_rag_chain.invoke(input_data)
    
    return {
        **state,
        "answer": response.answer,
        "citations": response.citations
    }

# Router function to determine the next node
def route_query(state: QueryState) -> str:
    """Route the query to the appropriate node based on action."""
    return state["action"]

# Build the graph
def build_query_graph():
    """Build the query processing graph."""
    workflow = StateGraph(QueryState)
    
    # Add nodes
    workflow.add_node("decision", decision_node)
    workflow.add_node("direct_response", direct_response_node)
    workflow.add_node("vector_store", vector_store_node)
    workflow.add_node("wikipedia", wikipedia_node)
    
    # Connect decision node to appropriate action nodes
    workflow.add_conditional_edges(
        "decision",
        route_query,
        {
            "direct_response": "direct_response",
            "vector_store": "vector_store",
            "wikipedia": "wikipedia"
        }
    )
    
    # Connect all action nodes to END
    workflow.add_edge("direct_response", END)
    workflow.add_edge("vector_store", END)
    workflow.add_edge("wikipedia", END)
    
    # Set the entry point
    workflow.set_entry_point("decision")
    complied_graph = workflow.compile()

    # Save graph workflow image in the png file (one-time setup)
    # os.makedirs("graphs_flows", exist_ok=True)
    # query_graph = complied_graph.get_graph()
    # query_png_path = os.path.join("graphs_flows", "rag_query_graph.png")
    # with open(query_png_path, "wb") as f:
    #     f.write(query_graph.draw_mermaid_png())
    # print(f"RAG Query graph visualization saved to {query_png_path}")
    
    return complied_graph

# Main function to run the agent
def run_agent(question: str, db: Session, word_length: int = 250, use_web: bool = False) -> Dict[str, Any]:
    """Run the query agent and return the result."""
    # Build the graph
    graph = build_query_graph()
    
    # Initialize state
    initial_state = QueryState(
        question=question,
        word_length=word_length,
        action="",
        response="",
        answer="",
        citations=[],
        use_web=use_web,
        db=db
    )
    
    # Run the graph
    final_state = graph.invoke(initial_state)
    
    # Map citation IDs to document metadata
    mapped_citations = []
    if final_state["citations"]:
        mapped_citations = resource_service.map_citations_to_metadata(final_state["citations"])
    
    return {"answer": final_state["answer"], "citations":mapped_citations}
