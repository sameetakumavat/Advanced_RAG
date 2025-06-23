import streamlit as st
from theme_setup import setup_theme
from layout import render_sidebar, render_authenticated_layout, render_unauthenticated_layout

# Theme Configuration
setup_theme()

# Session state initialization
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "token" not in st.session_state:
    st.session_state.token = None
if "username" not in st.session_state:
    st.session_state.username = None
if "active_tab" not in st.session_state:
    st.session_state.active_tab = "login"

# Main Application
def main():
    st.title("Advanced RAG System")
    
    # Render sidebar
    render_sidebar()
    
    # Render main content area
    if st.session_state.authenticated:
        render_authenticated_layout()
    else:
        render_unauthenticated_layout()

if __name__ == "__main__":
    main()