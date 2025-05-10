# Advanced RAG System

A Retrieval-Augmented Generation system built with FastAPI, LangChain, and Streamlit that allows users to ask questions about their documents and get AI-generated answers with citations.

## Features

- **Document Management**: Upload and process PDF documents
- **Secure Authentication**: User registration and login system
- **Advanced RAG**: Question answering against uploaded documents with citations
- **Wikipedia Integration**: Alternative knowledge source for questions
- **Responsive UI**: Clean, intuitive interface built with Streamlit

## Technologies Used

- **Backend**: FastAPI, SQLAlchemy, JWT authentication
- **Frontend**: Streamlit
- **AI/ML**: LangChain, Groq AI models
- **Vector Store**: FAISS for document embeddings
- **Document Processing**: PyPDF2, LangChain Document Loaders

## Setup Instructions

### Prerequisites

- Python 3.12+
- Poetry package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Advanced_RAG

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Advanced_RAG
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Create environment variables file:
   ```bash
   cp src/env.txt src/.env
   ```
   
4. Edit the `.env` file with your credentials and settings:
   - Set `GROQ_API_KEY` with your Groq API key
   - Configure your JWT settings
   - Set file paths for your system

5. Initialize the database:
   ```bash
   cd src
   poetry run alembic upgrade head
   ```

6. Create the necessary directories:
   ```bash
   mkdir -p default_files rag_files selected_files
   ```

### Running the Application

1. Start the FastAPI backend:
   ```bash
   cd src
   poetry run uvicorn main:app
   ```

2. In a separate terminal, start the Streamlit frontend:
   ```bash
   cd src
   poetry run streamlit run streamlit_app.py
   ```

3. Open your browser and visit:
   - Streamlit UI: http://localhost:8501
   - FastAPI docs: http://localhost:8000/docs

## Usage

1. Registration and Login:
 - Register a new account with username, email, and password
 - Login with your credentials

2. Document Management:
- Upload PDF documents (one at a time)
- Select up to 3 documents for processing

3. Asking Questions:
 - Choose between "Documents" or "Wikipedia" as knowledge source
 - Type your question and set word limit
 - View the answer with relevant citations

4. Account Management:
 - Reset your password if needed
 - Logout when finished


## Project Structure
Advanced_RAG/
├── src/
│   ├── api/               # API endpoints
│   ├── chain/             # RAG chain implementations
│   ├── db/                # Database models and schemas
│   ├── frontend_ui/       # Streamlit UI components
│   ├── services/          # Business logic
│   ├── main.py            # FastAPI entry point
│   └── streamlit_app.py   # Streamlit entry point
└── README.md


## API Endpoints

### Authentication
- `POST /auth/token`: Login and get access token
- `POST /auth/create_user`: Create new user
- `GET /auth/get_all_users`: List all users (admin)
- `GET /auth/get_user/{user_id}`: Get user details
- `PUT /auth/reset_password`: Reset user password
- `DELETE /auth/delete_user/{username}`: Delete a user

### File Management
- `POST /files/upload`: Upload a PDF file
- `GET /files/list`: List available files
- `POST /files/select`: Select files for RAG processing

### RAG Operations
- `POST /chain/initialize`: Initialize RAG resources
- `POST /chain/ask_documents`: Ask a question using selected documents
- `POST /chain/ask_wikipedia`: Ask a question using Wikipedia

## Future Enhancements

- Multi-user file sharing and permissions
- Advanced RAG techniques (hybrid search, re-ranking)
- User preferences and customization
