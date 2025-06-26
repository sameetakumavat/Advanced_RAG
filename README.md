# Advanced RAG System

A Retrieval-Augmented Generation (RAG) system that enables AI-powered question answering over your documents with accurate citations.

> **Development Status (June 2025):** Both backend API and frontend UI for Chat and Query features are operational but still under active development. Core functionality (authentication, file management, document processing, dashboard) is stable and ready for use.

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

## Project Structure

The project is organized into two main components:

- **Backend**: FastAPI server handling authentication, document processing, and RAG operations
- **Interactive UI**: Modern Node.js/Express frontend with responsive design and intuitive interfaces

## Current Development Status

- ✅ Backend API implementation
- ✅ Authentication system
- ✅ File management interface
- ✅ Document processing and indexing
- 🔄 Query interface (in progress)
- 🔄 Chat interface (in progress)

## Quick Start

### Backend Setup
1. Follow setup instructions in [backend/README.md](backend/README.md)
2. Start API server: `cd backend && python main.py`
3. API documentation available at http://localhost:8000/docs

### Frontend Setup
1. Follow setup instructions in [interactive-ui/README.md](interactive-ui/README.md)
2. Start frontend server: `cd interactive-ui && npm start`
3. Access the UI at http://localhost:3000

## Future Enhancements

- Enhanced chat session persistence
- Advanced visualization of document relationships
- Integration with additional knowledge sources
- Multi-modal document processing (images, audio)

## License

MIT License