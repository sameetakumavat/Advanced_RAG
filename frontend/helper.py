import streamlit as st
import requests
from typing import Dict

# Configuration
API_URL = "http://localhost:8000"  # FastAPI backend URL

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
