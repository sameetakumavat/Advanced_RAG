import logging
from typing import TypedDict, List, Dict, Any
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END, START
from langchain_core.prompts import ChatPromptTemplate
from initalize_resources import resource_service
from prompt import DECISION_PROMPT
from schemas.rag_models import QueryDecision, RagInput
from chains_and_agents.rag_chain import rag_chain, wikipedia_rag_chain

# Initialize logger
logger = logging.getLogger(__name__)

chat_model = ChatGroq(model=resource_service.model, api_key=resource_service.api_key, temperature=0.1)

class QueryState(TypedDict):
    question: str                   
    word_length: int                
    document_descriptions: str       
    approve_web_search: bool        
    action: str                      
    answer: str                      
    citations: List[int]

def decision_node(state: QueryState) -> QueryState:
    """Determine the best path for answering the query."""
    prompt = ChatPromptTemplate.from_template(DECISION_PROMPT)
    structured_chat_model = chat_model.with_structured_output(QueryDecision)
    result = structured_chat_model.invoke(prompt.invoke({
        "question": state["question"], 
        "document_descriptions": state["document_descriptions"]
    }))
    
    if result.query_type == "greeting":
        return {
            **state,
            "action": "end",
            "answer": result.response,
            "citations": []
        }
    elif result.query_type == "document_search":
        return {
            **state,
            "action": "vector_store"
        }
    else:  # External knowledge
        if state.get("approve_web_search", False):
            logger.debug(f"External knowledge needed. Using web search.")
            return {
                **state,
                "action": "wikipedia"
            }
        else:
            logger.debug(f"External knowledge needed but web search not approved.")
            return {
                **state,
                "action": "end",
                "answer": "I need external knowledge to answer this question, and web search is not enabled."
            }
    

def vector_store_node(state: QueryState) -> QueryState:
    """Retrieve from vector store and generate an answer."""
    response = rag_chain.invoke(RagInput(
        question=state["question"], 
        word_length=state["word_length"]
    ))
    
    needs_web_search = "don't know based on the provided information" in response.answer.lower()
    
    # Route based on result quality and web search approval
    if needs_web_search and state.get("approve_web_search", False):
        # Go to Wikipedia for additional information
        logger.debug("Vector store: Insufficient information. Using web search.")
        return {
            **state,
            "action": "wikipedia"
        }
    else:
        # Direct to end with vector store results
        if needs_web_search:
            logger.debug("Vector store: Insufficient info, web search not approved.")
        else:
            logger.debug("Vector store: Sufficient information found.")
            
        return {
            **state,
            "action": "end",
            "answer": response.answer,
            "citations": response.citations
        }

def wikipedia_node(state: QueryState) -> QueryState:
    """Retrieve from Wikipedia and generate an answer."""
    response = wikipedia_rag_chain.invoke(RagInput(
        question=state["question"], 
        word_length=state["word_length"]
    ))
    
    return {
        **state,
        "action": "end",
        "answer": response.answer,
        "citations": response.citations
    }

def route_next_step(state: QueryState) -> str:
    """Simple router that returns the action from state."""
    return state["action"]

def build_query_graph():
    """Build query processing graph."""
    workflow = StateGraph(QueryState)
    
    workflow.add_node("decision", decision_node)
    workflow.add_node("vector_store", vector_store_node)
    workflow.add_node("wikipedia", wikipedia_node)
    
    workflow.add_edge(START, "decision")
    
    workflow.add_conditional_edges("decision", route_next_step, {
        "vector_store": "vector_store",
        "wikipedia": "wikipedia",
        "end": END
    })
    
    workflow.add_conditional_edges("vector_store", route_next_step, {
        "wikipedia": "wikipedia",
        "end": END
    })
    
    workflow.add_edge("wikipedia", END)
    return workflow.compile()

def execute_rag_agent(question: str, document_descriptions: str, word_length: int = 250, approve_web_search: bool = False) -> Dict[str, Any]:
    """Execute the RAG agent with the given parameters."""
    try:
        graph = build_query_graph()
        initial_state = QueryState(
            question=question,
            word_length=word_length,
            document_descriptions=document_descriptions,
            action="",
            answer="",
            citations=[],
            approve_web_search=approve_web_search
        )
        
        result = graph.invoke(initial_state)
        
        mapped_citations = []
        if "citations" in result and result["citations"]:
            mapped_citations = resource_service.map_citations_to_metadata(result["citations"])
        
        return {
            "completed": True,
            "answer": result.get("answer", ""),
            "citations": mapped_citations,
            "used_web_search": result.get("action") == "wikipedia"
        }
            
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}", exc_info=True)
        return {
            "completed": False,
            "answer": f"Error processing your question: {str(e)}",
            "citations": []
        }
