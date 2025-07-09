# Advanced RAG System - Backend

This is the backend API for the Advanced RAG (Retrieval-Augmented Generation) system, built with FastAPI, LangChain and LangGraph. It manages authentication, document storage, and AI-powered question answering with citations.

## Features

- **RESTful API**: FastAPI-powered endpoints for all operations
- **Authentication**: JWT-based secure authentication system with token management
- **Database**: SQLite with SQLAlchemy ORM and Alembic migrations
- **File Management**: Upload, list, select, and automatic summarization of PDF documents
- **RAG Implementation**: Using LangChain, LangGraph agentic flows, FAISS vectorstore, HuggingFace embeddings, and Groq AI models for accurate retrieval
- **Wikipedia Integration**: Alternative knowledge source for questions outside document scope
- **Graph-Based Agents**: LangGraph implementation for intelligent query routing and processing
- **Conversational RAG**: Stateful chat sessions with context awareness and citation tracking
- **Session Management**: Multiple active chat sessions with history tracking

## Setup Instructions

### Prerequisites

- Python 3.12+
- Virtual Environment
- Groq API key (for the LLM)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Advanced_RAG/backend
   ```

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
   - Configure `JWT_SECRET_KEY` for authentication (used for token generation)
   - Default model is `llama-3.3-70b-versatile` but can be changed in the `.env` file

6. Create the upload directory if it doesn't exist:
   ```bash
   mkdir -p uploaded_files
   ```

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

1. Start the FastAPI server:
   ```bash
   python main.py
   ```

2. The server will run on port 8000 by default. Access the API at:
   - API Documentation: http://localhost:8000/docs
   - Alternative Docs UI: http://localhost:8000/redoc
   - Health Check: http://localhost:8000/

3. Usage workflow:
   - First authenticate using `/auth/token` endpoint
   - Upload PDF documents using `/files/upload_files`
   - Select files for processing with `/files/select_files`
   - Initialize the RAG system with `/chain/initialize`
   - Use either single-question endpoints or start a chat session

4. For chat functionality:
   - Start a session with `/chat/start`
   - Send messages using `/chat/message` endpoint
   - View history with `/chat/history/{session_id}`
   - End session with `/chat/end/{session_id}`

## System Architecture

### Overview
The system uses a modular architecture built around FastAPI, with several key components:

- **Routes**: API endpoints organized by functionality (auth, files, RAG, chat)
- **Services**: Core business logic and infrastructure components
- **Chains & Agents**: LangChain and LangGraph implementations for RAG functionality
- **Database Models**: SQLAlchemy models for persistent storage
- **Schemas**: Pydantic models for request/response validation

### Key Components

1. **Authentication System**:
   - JWT token-based authentication
   - Bcrypt password hashing
   - User management and session tracking

2. **File Management**:
   - PDF file upload and storage
   - Automatic document summarization using LLMs
   - File selection for RAG processing

3. **RAG Implementation**:
   - Document chunking and vector embedding
   - FAISS vector store for similarity search
   - LangGraph agent for query routing
   - Citation tracking and formatting

4. **Chat System**:
   - Session-based conversations
   - Context-aware responses
   - History tracking and reference
   - LangGraph workflow for intelligent responses

### Data Flow

1. User authenticates and receives a token
2. User uploads and selects documents
3. System initializes the RAG pipeline (embedding documents)
4. User can then:
   - Ask single questions with the RAG agent
   - Start a chat session for conversational interactions
5. All responses include relevant citations to document sources

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

### Chat Operations
- `POST /chat/start`: Start a new chat session
- `GET /chat/get_list_of_active_sessions`: Get all active chat sessions for a user
- `POST /chat/message`: Send a message to an existing chat session
- `GET /chat/history/{session_id}`: Get complete history of a chat session
- `DELETE /chat/end/{session_id}`: End a chat session

## Project Structure
```
backend/
├── alembic.ini                # Alembic configuration
├── db_migrations/             # Database migration scripts
├── chains_and_agents/         # RAG implementations
│   ├── chat_rag_agent.py      # Conversational RAG with LangGraph
│   ├── file_summary.py        # Document summarization
│   ├── rag_agent.py           # Single-question LangGraph agent
│   └── rag_chain.py           # Basic RAG chain implementation
├── route/                     # API endpoints
│   ├── auth_route.py          # Authentication routes
│   ├── chat_route.py          # Chat session routes
│   ├── file_route.py          # File management routes
│   └── rag_route.py           # RAG/QA routes
├── schemas/                   # Pydantic models
│   ├── auth.py                # Authentication schemas
│   ├── chat_models.py         # Chat input/output schemas
│   └── rag_models.py          # RAG input/output schemas
├── services/                  # Business logic
│   ├── AuthService.py         # Authentication services
│   ├── DataBaseConfig.py      # Database configuration
│   ├── RAGResourceServices.py # RAG resource management
│   └── SessionManager.py      # Chat session management
├── db_models.py               # SQLAlchemy models
├── main.py                    # Application entry point
└── prompt.py                  # LLM prompt templates
```

## Environment Variables

The system requires the following environment variables to be set in the `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| MODEL_NAME | The Groq model to use for LLM operations | llama-3.3-70b-versatile |
| GROQ_API_KEY | API key for Groq | your-api-key-here |
| JWT_SECRET_KEY | Secret key for JWT token generation | your-secret-key-here |
| ALGORITHM | Algorithm for JWT token | HS256 |

## Troubleshooting

### Common Issues

1. **Database initialization error**
   - Ensure you've run `alembic upgrade head` to create all database tables
   - Check that the SQLite database file has correct permissions

2. **File upload errors**
   - Make sure the `uploaded_files` directory exists and has write permissions
   - Check if the file size is within limits (defaults to 20MB)

3. **RAG initialization failures**
   - Check your Groq API key is valid and has sufficient quota
   - Ensure selected files exist and are valid PDFs
   - Look for error messages in the server logs

4. **Authentication issues**
   - Verify your JWT_SECRET_KEY is set correctly
   - Check token expiration (default is 30 minutes)
   - Ensure user exists in the database

### Logging

The application uses Python's standard logging module. To enable more verbose logging for debugging, modify the logging configuration in the main application file.

## License

This project is licensed under the terms of the LICENSE file included in the repository.
