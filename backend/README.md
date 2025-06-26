# Advanced RAG System - Backend

This is the backend API for the Advanced RAG (Retrieval-Augmented Generation) system, built with FastAPI, LangChain and LangGraph. It manages authentication, document storage, and AI-powered question answering with citations.

> **Note (June 2025):** The Chat interface and advanced query routing features are still in active development. Core functionality (authentication, file management, dashboard, and basic RAG) is stable and fully implemented.

## Features

- **RESTful API**: FastAPI-powered endpoints for all operations
- **Authentication**: JWT-based secure authentication system
- **Database**: SQLite with SQLAlchemy ORM and Alembic migrations
- **File Management**: Upload, list, and selection of PDF documents
- **RAG Implementation**: Using LangChain, FAISS and Groq AI models
- **Wikipedia Integration**: Alternative knowledge source for questions
- **Graph-Based Agents**: LangGraph implementation for both single question and chat workflows
- **Conversational RAG**: Stateful chat sessions with context awareness and history summarization

## Setup Instructions

### Prerequisites

- Python 3.12+
- Virtual Environment

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Advanced_RAG/backend

2. Create and activate a virtual environment:
   ```bash
   python -m venv rag_venv
   source rag_venv/bin/activate
   # On Windows: rag_venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment variables file:
   ```bash
   cp env.txt .env
   ```
   
5. Edit the `.env` file with your credentials and settings:
   - Set `GROQ_API_KEY` with your Groq API key
   - Configure JWT_SECRET_KEY for authentication

7. Initialize the database with Alembic:
   ```bash
   alembic upgrade head
   ```

8. If you need to create new migrations after modifying models:
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   alembic upgrade head
   ```

### Running the Application

Start the FastAPI server:
   ```bash
   python main.py
   ```

Access the API documentation at http://localhost:8000/docs

## API Endpoints

### Authentication
- `POST /auth/token`: Get authentication token
- `POST /auth/create_user`: Register new user
- `GET /auth/get_all_users`: List all users (admin)
- `GET /auth/get_user/{user_id}`: Get user details
- `PUT /auth/reset_password`: Reset user password
- `DELETE /auth/delete_user/{username}`: Delete a user

### File Management
- `POST /files/upload_files`: Upload PDF files
- `GET /files/list_all_uploaded_files`: List available files
- `POST /files/select_files`: Select files for RAG processing
- `GET /files/selected`: Get currently selected files
- `DELETE /files/{file_id}`: Delete a file

### RAG Operations
- `POST /chain/initialize`: Initialize RAG resources with selected files
- `GET /chain/status`: Check RAG system initialization status
- `POST /chain/ask_documents`: Ask a question using selected documents
- `POST /chain/ask_wikipedia`: Ask a question using Wikipedia
- `POST /chain/ask_question`: Ask a question with automatic routing to documents or Wikipedia
- `POST /chain/ask_rag_agent`: Ask a question using the LangGraph agent

### Dashboard Operations
- `GET /dashboard/stats`: Get user dashboard statistics (file count, username, etc.)

### Chat Operations
- `POST /chat/start`: Start a new chat session
- `POST /chat/message`: Send a message in an existing chat session
- `GET /chat/history/{session_id}`: Get chat history for a session
- `DELETE /chat/end/{session_id}`: End a chat session

## Project Structure
```
backend/
├── alembic.ini                # Alembic configuration
├── db_migrations/             # Database migration scripts
├── chains/                    # RAG implementations
│   ├── chat_rag_agent.py      # Conversational RAG with LangGraph
│   ├── decision_chain.py      # Query routing logic
│   ├── file_summary.py        # Document summarization
│   ├── rag_agent.py           # Single-question LangGraph agent
│   └── rag_chain.py           # Basic RAG chain implementation
├── route/                     # API endpoints
│   ├── auth_route.py          # Authentication routes
│   ├── chat_route.py          # Chat session routes
│   ├── file_route.py          # File management routes
│   ├── dashboard_route.py     # Dashboard stats routes
│   └── rag_route.py           # RAG/QA routes
├── schemas/                   # Pydantic models
│   ├── auth.py                # Authentication schemas
│   └── rag_models.py          # RAG input/output schemas
├── services/                  # Business logic
│   ├── AuthService.py         # Authentication service
│   ├── DataBaseConfig.py      # Database configuration
│   └── RAGResourceServices.py # RAG services
├── db_models.py               # SQLAlchemy ORM models
├── initalize_resources.py     # Resource initialization
├── main.py                    # Application entry point
├── prompt.py                  # AI prompt templates
└── requirements.txt           # Dependencies
```

## Production Recommendations

For production deployment, consider the following enhancements:

1. **Chat Session Persistence**: Implement database storage for chat sessions to persist across server restarts
2. **Document-Session Linkage**: Associate chat sessions with specific document selections
3. **Session Management**: Add TTL (time-to-live) policies for archived chat sessions
4. **Multi-User Scalability**: Optimize for concurrent users with proper session isolation
5. **Authentication Enhancements**: Add refresh tokens and session expiration
6. **Monitoring**: Add logging and performance monitoring
