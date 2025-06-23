import streamlit as st
from typing import Optional, Dict, List
import requests

# Configuration
API_URL = "http://localhost:8000"  # FastAPI backend URL

# Core API calling function
def call_api(endpoint: str, method: str = "GET", data: Dict = None, 
             headers: Dict = None, files: Dict = None) -> Dict:
    """Make API calls to the FastAPI backend."""
    url = f"{API_URL}{endpoint}"
    
    if headers is None:
        headers = {}
    
    if st.session_state.token and "Authorization" not in headers:
        headers["Authorization"] = f"Bearer {st.session_state.token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            if files:
                response = requests.post(url, headers=headers, data=data, files=files)
            else:
                # Check if we're sending form data or JSON
                if headers.get("Content-Type") == "application/x-www-form-urlencoded":
                    response = requests.post(url, headers=headers, data=data)
                else:
                    response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return {"error": "Invalid method"}
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            # Handle authentication issues
            st.session_state.authenticated = False
            st.session_state.token = None
            st.session_state.username = None
            return {"error": "Authentication failed. Please log in again.", "auth_failed": True}
        else:
            return {"error": f"Status code: {response.status_code}, Message: {response.text}"}
    
    except Exception as e:
        return {"error": str(e)}

# Authentication Functions
def login(username: str, password: str) -> Optional[str]:
    """Log in the user and return auth token."""
    response = call_api(
        "/auth/token", 
        "POST", 
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if "error" in response:
        st.error(f"Login failed: {response['error']}")
        return None
    
    if "access_token" in response:
        return response["access_token"]
    
    st.error("Login failed: Invalid response from server")
    return None

def register_user(username: str, email: str, password: str) -> bool:
    """Register a new user."""
    response = call_api(
        "/auth/create_user",
        "POST",
        data={"username": username, "email": email, "password": password}
    )
    
    if "error" in response:
        st.error(f"Registration failed: {response['error']}")
        return False
    return True

def reset_password(username: str, new_password: str) -> bool:
    """Reset user password."""
    response = call_api(
        "/auth/reset_password",
        "PUT",
        data={"username": username, "new_password": new_password}
    )
    
    if "error" in response:
        st.error(f"Password reset failed: {response['error']}")
        return False
    return True


# File Management Functions
def upload_file(file) -> bool:
    """Upload a file to the server."""
    if file is not None:
        files = {"file": (file.name, file, "application/octet-stream")}
        response = call_api("/files/upload", "POST", files=files)
        
        if "error" in response:
            if "auth_failed" in response:
                st.error("Your session has expired. Please log in again.")
                st.rerun()
            st.error(f"Upload failed: {response['error']}")
            return False
        return True
    return False

def list_files() -> list:
    """List all available files."""
    response = call_api("/files/list", "GET")
    if "error" in response:
        if "auth_failed" in response:
            st.error("Your session has expired. Please log in again.")
            st.rerun()
        st.error(f"Failed to list files: {response['error']}")
        return []
    return response.get("files", [])

def select_files(selected_files: list) -> bool:
    """Select files for RAG processing."""
    response = call_api("/files/select", "POST", data=selected_files)
    if "error" in response:
        if "auth_failed" in response:
            st.error("Your session has expired. Please log in again.")
            st.rerun()
        st.error(f"Failed to select files: {response['error']}")
        return False
    return True

def initialize_resources() -> bool:
    """Initialize RAG resources."""
    response = call_api("/chain/initialize", "POST")
    if "error" in response:
        if "auth_failed" in response:
            st.error("Your session has expired. Please log in again.")
            st.rerun()
        st.error(f"Failed to initialize resources: {response['error']}")
        return False
    return True

def ask_question(question: str, word_limit: int = 150, source: str = "documents") -> Dict:
    """Ask a question to the RAG system."""
    endpoint = "/chain/ask_documents" if source == "documents" else "/chain/ask_wikipedia"
    response = call_api(endpoint, "POST", data={"question": question, "word_length": word_limit})

    if "error" in response:
        if "auth_failed" in response:
            st.error("Your session has expired. Please log in again.")
            st.rerun()
        st.error(f"Failed to get answer: {response['error']}")
        return {}
    return response
