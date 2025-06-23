import streamlit as st
from frontend_ui import ui_components

def render_sidebar():
    """Render the sidebar with navigation and user profile."""
    if st.session_state.authenticated:
        # Show user profile
        ui_components.show_user_profile()
        
        # Navigation menu
        st.sidebar.markdown("### Navigation")
        
        # Stylized navigation buttons
        if st.sidebar.button("📄 Document Management", use_container_width=True):
            st.session_state.active_tab = "file_management"
            st.rerun()
            
        if st.sidebar.button("❓ Ask Questions", use_container_width=True):
            st.session_state.active_tab = "ask_questions"
            st.rerun()
            
        # Settings and help
        st.sidebar.markdown("---")
        st.sidebar.markdown("### Settings")
        
        if st.sidebar.button("🔄 Reset Password", use_container_width=True):
            st.session_state.active_tab = "reset_password"
            st.rerun()

        if st.sidebar.button("🚪 Logout", use_container_width=True):
            st.session_state.authenticated = False
            st.session_state.token = None
            st.session_state.username = None
            st.session_state.active_tab = "login"
            st.rerun()
    else:
        st.sidebar.markdown("### Advanced RAG System")
        st.sidebar.markdown("""
        Welcome to the Advanced RAG System! This application allows you to:
        
        - Upload and process documents
        - Ask questions about your documents
        - Get answers with citations
        - Use Wikipedia as an alternative knowledge source
        
        Please log in or register to get started.
        """)

def render_authenticated_layout():
    """Render the main layout for authenticated users."""
    # Set default active tab if not set
    if st.session_state.active_tab not in ["file_management", "ask_questions", "reset_password", "history"]:
        st.session_state.active_tab = "file_management"
    
    # Render content based on active tab
    if st.session_state.active_tab == "file_management":
        ui_components.show_file_management()
    elif st.session_state.active_tab == "ask_questions":
        ui_components.show_rag_interface()
    elif st.session_state.active_tab == "reset_password":
        ui_components.show_password_reset_form()

def render_unauthenticated_layout():
    """Render the main layout for unauthenticated users."""
    if st.session_state.active_tab not in ["login", "register", "reset_password"]:
        st.session_state.active_tab = "login"
    
    # Display the appropriate form based on active tab
    if st.session_state.active_tab == "login":
        # Remove all buttons from ui_components.show_login_form() and only use the form itself
        ui_components.show_login_form()
                
    elif st.session_state.active_tab == "register":
        ui_components.show_register_form()
        
        # Show back to login option
        if st.button("Back to Login", key="reg_back_btn", use_container_width=True):
            st.session_state.active_tab = "login"
            st.rerun()
            
    elif st.session_state.active_tab == "reset_password":
        ui_components.show_password_reset_form()
        
        # Show back to login option
        if st.button("Back to Login", key="reset_back_btn", use_container_width=True):
            st.session_state.active_tab = "login"
            st.rerun()
