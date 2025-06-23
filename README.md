# Advanced RAG System

A Retrieval-Augmented Generation (RAG) system that enables AI-powered question answering over your documents with accurate citations.

## Overview

This project combines document processing, vector embeddings, and LLMs to provide precise answers to questions about uploaded documents. It features a FastAPI backend and supports multiple frontend options.

## Features

- **Document Management**: Upload, select, and manage PDF documents
- **Secure Authentication**: JWT-based user management system
- **Advanced RAG with Citations**: Get precise answers with references to source documents
- **Multi-Source Knowledge**: Query both documents and Wikipedia
- **Graph-Based Agent Architecture**: Using LangGraph for robust, modular workflows
- **Conversational RAG**: Chat mode with context awareness and history summarization
- **Single-Shot and Chat Modes**: Choose between direct questions or continuous conversation
- **Adaptive Query Routing**: Intelligent routing to the right knowledge source
- **File Summarization**: Automatic generation of document summaries

## Architecture

The system uses a modular architecture with the following components:

- **Backend**: FastAPI server with SQLite database
- **RAG Engine**: LangChain and FAISS-based retrieval system
- **LLM Integration**: Groq API for fast and accurate responses
- **Agent Framework**: LangGraph for composable, declarative workflows

## Quick Start

1. Follow setup instructions in [backend/README.md](backend/README.md)
2. Start API server: `cd backend && python main.py`
3. API documentation available at http://localhost:8000/docs

## Future Enhancements

- Chat session persistence with database storage
- Document-aware chat session management
- Enhanced user interface with result visualization
- Multi-modal document processing (images, audio)

## License

[Your License Here]