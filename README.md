# Advanced RAG System

A Retrieval-Augmented Generation (RAG) system that enables AI-powered question answering over your documents with accurate citations.

## Overview

This project combines document processing, vector embeddings, and LLMs to provide precise answers to questions about uploaded documents. It features a FastAPI backend and a modern interactive UI frontend.

## Features

- **Document Management**: Upload, select, and manage PDF documents
- **Secure Authentication**: JWT-based user management system
- **Dashboard**: User statistics and system status monitoring
- **Background Processing**: Asynchronous document indexing with status tracking
- **Advanced RAG with Citations**: Get precise answers with references to source documents
- **Multi-Source Knowledge**: Query both documents and Wikipedia
- **Graph-Based Agent Architecture**: Using LangGraph for robust, modular workflows
- **Conversational RAG**: Chat mode with context awareness and history summarization
- **Single-Shot and Chat Modes**: Choose between direct questions or continuous conversation
- **Adaptive Query Routing**: Intelligent routing to the right knowledge source
- **File Summarization**: Automatic generation of document summaries
- **Session Management**: Persistent chat sessions with history tracking
- **Export Functionality**: Download conversation history as CSV
- **Navigation Protection**: Warning system for active chat sessions

## Key Capabilities

### Advanced Document Processing
- Automatic PDF chunking and embedding
- Document summarization for better context
- Citation tracking with page numbers
- Support for multiple document selection

### Intelligent Query Handling
- Context-aware query processing
- Automatic source routing (documents vs. Wikipedia)
- Confidence scoring and uncertainty handling
- Structured response formatting with citations

### Conversational AI
- Multi-session chat management
- Context retention across conversations
- History summarization for long sessions
- Follow-up question handling

### Modern User Experience
- Responsive design for all devices
- Real-time status updates
- Interactive citation tooltips
- Intuitive document management

## Project Structure

The project is organized into two main components:

- **Backend**: FastAPI server handling authentication, document processing, and RAG operations
- **Interactive UI**: Modern Node.js/Express frontend with responsive design and intuitive interfaces

## Current Development Status

- ✅ Backend API implementation
- ✅ Authentication system
- ✅ File management interface
- ✅ Document processing and indexing
- ✅ Query interface with citation tracking
- ✅ Chat interface with session management

## Quick Start

### Backend Setup
1. Follow setup instructions in [backend/README.md](backend/README.md)
2. Start API server: `cd backend && python main.py`
3. API documentation available at http://localhost:8000/docs

### Frontend Setup
1. Follow setup instructions in [interactive-ui/README.md](interactive-ui/README.md)
2. Start frontend server: `cd interactive-ui && npm start`
3. Access the UI at http://localhost:3000

## Installation Summary

### Prerequisites
- Python 3.12+ (for backend)
- Node.js 14+ (for frontend)
- Groq API key (for LLM access)

### Backend Installation
```bash
# Clone repository
git clone <repository-url>

# Navigate to backend directory
cd Advanced_RAG/backend

# Create and activate virtual environment
python -m venv rag_venv
source rag_venv/bin/activate  # On Windows: rag_venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.txt .env
# Edit .env with your Groq API key and JWT secret

# Initialize database
alembic upgrade head

# Start backend server
python main.py
```

### Frontend Installation
```bash
# Navigate to frontend directory
cd ../interactive-ui

# Install dependencies
npm install

# Start the frontend server
npm start
```

### First Steps After Installation
1. Access the frontend at http://localhost:3000
2. Register a new user account
3. Upload PDF documents via the File Management interface
4. Select documents for processing
5. Initialize the RAG system
6. Start asking questions through either Query or Chat interface

## Future Enhancements

- Dark mode UI theme support
- Advanced visualization of document relationships
- Integration with additional knowledge sources (academic databases, news APIs)
- Multi-modal document processing (images, audio, video)
- User preferences and customizable settings
- Enhanced analytics and usage reporting
- Additional document format support (beyond PDF)

## System Architecture

The Advanced RAG System uses a modern architecture with clear separation between backend and frontend:

### Backend
- **FastAPI**: High-performance API framework
- **LangChain/LangGraph**: RAG implementation with agentic workflows
- **SQLAlchemy/SQLite**: Database for user and document management
- **FAISS**: Vector storage for document embeddings
- **Groq**: LLM provider for query processing

### Frontend
- **Express.js**: Web server framework
- **EJS**: Templating engine for dynamic content
- **Modern CSS**: Glass morphism effects and responsive design
- **Proxy Integration**: Seamless API communication

## Screenshots

<div align="center">
  <p><i>Login Screen</i></p>
  <img src="screenshots/login.png" alt="Login Screen" width="600"/>
  
  <p><i>Dashboard</i></p>
  <img src="screenshots/dashboard.png" alt="Dashboard" width="600"/>
  
  <p><i>Chat Interface</i></p>
  <img src="screenshots/chat.png" alt="Chat Interface" width="600"/>
</div>

## Acknowledgements

- **LangChain**: Core RAG implementation framework
- **LangGraph**: For agentic workflow structure
- **Groq**: For fast LLM inference 
- **FastAPI**: Backend API framework
- **Express.js**: Frontend server framework

## Author

Created by Sameeta Kumavat

## License

MIT License