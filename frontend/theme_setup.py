import streamlit as st

def setup_theme():
    """Configure custom theme for the Streamlit app."""
    st.set_page_config(
        page_title="Advanced RAG System",
        page_icon="🧠",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS
    st.markdown("""
        <style>
        :root {
            --primary-color: #7E57C2;
            --secondary-color: #5E35B1;
            --background-color: #f5f5f9;
        }
        
        .main {
            background-color: var(--background-color);
        }
        
        .css-1d391kg {
            background-color: #1e293b;
        }
        
        h1, h2, h3 {
            color: var(--primary-color) !important;
            font-weight: 600 !important;
        }
        
        .stButton>button {
            background-color: var(--primary-color);
            color: white;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            border: none;
            transition: background-color 0.3s ease;
        }
        
        .stButton>button:hover {
            background-color: var(--secondary-color);
        }
        
        .card {
            padding: 1.5rem;
            border-radius: 8px;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
        }
        
        .profile-container {
            padding: 1rem;
            background-color: rgba(255,255,255,0.1);
            border-radius: 8px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 0.5rem auto;
            background-color: #7E57C2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: white;
            font-weight: bold;
        }
        </style>
    """, unsafe_allow_html=True)
