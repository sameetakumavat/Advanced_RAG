import streamlit as st
from frontend_ui import api_functions

def show_user_profile():
    """Display user profile in sidebar - compact version."""
    # Create a more compact profile display
    st.sidebar.markdown("""
        <div style="display: flex; align-items: center; padding: 8px; 
                    background-color: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 15px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background-color: #7E57C2;
                        display: flex; align-items: center; justify-content: center; 
                        font-size: 18px; color: white; margin-right: 10px;">
                {0}
            </div>
            <div style="color: black; font-size: 16px; overflow: hidden; text-overflow: ellipsis;">
                {1}
            </div>
        </div>
    """.format(
        st.session_state.username[0].upper() if st.session_state.username else "U",
        st.session_state.username
    ), unsafe_allow_html=True)

def show_login_form():
    """Display login form."""
    with st.container():
        st.subheader("Login")
        
        username = st.text_input("Username", key="login_username")
        password = st.text_input("Password", type="password", key="login_password")
        
        # Main login button
        if st.button("Login", key="login_btn", use_container_width=True):
            token = api_functions.login(username, password)
            if token:
                st.session_state.token = token
                st.session_state.authenticated = True
                st.session_state.username = username
                st.success("Login successful!")
                st.rerun()
        
        # Navigation options
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("New User? Register", key="nav_register_btn", use_container_width=True):
                st.session_state.active_tab = "register"
                st.rerun()
        with col2:
            if st.button("Forgot Password?", key="nav_forgot_btn", use_container_width=True):
                st.session_state.active_tab = "reset_password"
                st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)

def show_register_form():
    """Display registration form."""
    with st.container():
        st.subheader("Register")
        
        username = st.text_input("Username", key="reg_username")
        email = st.text_input("Email", key="reg_email")
        password = st.text_input("Password", type="password", key="reg_password")
        confirm_password = st.text_input("Confirm Password", type="password", key="reg_confirm")
        
        if st.button("Register", use_container_width=True):
            if not username or not email or not password:
                st.error("All fields are required")
            elif password != confirm_password:
                st.error("Passwords do not match!")
            else:
                if api_functions.register_user(username, email, password):
                    st.success("Registration successful! Please log in.")
                    st.session_state.active_tab = "login"
                    st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)

def show_password_reset_form():
    """Display password reset form."""
    with st.container():
        st.subheader("Reset Password")
        
        username = st.text_input("Username", key="reset_username")
        new_password = st.text_input("New Password", type="password", key="reset_password")
        confirm_password = st.text_input("Confirm New Password", type="password", key="reset_confirm")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            if st.button("Reset Password", use_container_width=True):
                if not username or not new_password:
                    st.error("All fields are required")
                elif new_password != confirm_password:
                    st.error("Passwords do not match")
                else:
                    if api_functions.reset_password(username, new_password):
                        st.success("Password reset successful! Please log in with your new password.")
                        st.session_state.active_tab = "login"
                        st.rerun()
        
        with col2:
            if st.button("Back to Login", use_container_width=True):
                st.session_state.active_tab = "login"
                st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)

def show_file_upload():
    """Display file upload interface."""
    st.subheader("Upload Document")
    
    uploaded_file = st.file_uploader("Upload a PDF file", type="pdf")
    if uploaded_file is not None:
        if st.button("Upload File", use_container_width=True):
            if api_functions.upload_file(uploaded_file):
                st.success(f"File {uploaded_file.name} uploaded successfully!")
    
    st.markdown('</div>', unsafe_allow_html=True)

def show_file_selection():
    """Display file selection interface."""
    st.subheader("Select Files for RAG")
    
    files = api_functions.list_files()
    if files:
        selected = st.multiselect("Select up to 3 files", files)
        if st.button("Use Selected Files", use_container_width=True) and selected:
            if len(selected) > 3:
                st.error("You can select a maximum of 3 files.")
            else:
                if api_functions.select_files(selected):
                    if api_functions.initialize_resources():
                        st.success("Files selected and resources initialized successfully!")
    else:
        st.info("No files available. Please upload files first.")
    
    st.markdown('</div>', unsafe_allow_html=True)

def show_file_management():
    """Display file management interface."""
    show_file_upload()
    st.markdown("<br>", unsafe_allow_html=True)
    show_file_selection()

def show_rag_interface():
    """Display RAG query interface."""
    st.subheader("Ask a Question")

    # Source selection
    source = st.radio("Select knowledge source:", ["Documents", "Wikipedia"], horizontal=True)
    source_key = "documents" if source == "Documents" else "wikipedia"
    
    # Question input
    question = st.text_input("Your question:")
    word_limit = st.slider("Word limit for answer:", min_value=50, max_value=500, value=150)
    
    if st.button("Ask", use_container_width=True) and question:
        with st.spinner("Finding the answer..."):
            result = api_functions.ask_question(question, word_limit, source_key)
            
            if result and "answer" in result:
                st.markdown('</div>', unsafe_allow_html=True)  # Close the card
                
                st.subheader("Answer")
                st.write(result["answer"])
                st.markdown('</div>', unsafe_allow_html=True)
                
                if "citations" in result and result["citations"]:
                    st.subheader("Sources")
                    for i, citation in enumerate(result["citations"]):
                        with st.expander(f"Source {i+1}"):
                            st.write(f"**Source:** {citation.get('source', 'N/A')}")
                            if "page" in citation:
                                st.write(f"**Page:** {citation.get('page', 'N/A')}")
                            st.write("**Content:**")
                            st.write(citation.get("page_content", ""))
                    st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.markdown('</div>', unsafe_allow_html=True)  # Close the card
