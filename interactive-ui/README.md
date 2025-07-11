# Smart Document Assistant - Interactive UI

This is the user interface for the Smart Document Assistant, built with Express.js and EJS templating. It provides an intuitive, modern interface for interacting with the AI-powered backend, featuring glass morphism effects, responsive layout, and seamless document Q&A.

## Features

- **Modern UI Design**: Glass morphism effects with animated particle backgrounds
- **Authentication System**: Complete login, registration, and password reset functionality
- **Responsive Interface**: Works perfectly across desktop, tablet, and mobile devices
- **Dashboard**: User statistics and system status monitoring dashboard
- **Document Management**: Intuitive interface for uploading, viewing, and managing PDF files
- **Query Interface**: Single-question interface with intelligent source routing
- **Chat Interface**: Conversational interaction with documents including citation tracking
- **Session Management**: Multiple persistent chat sessions with history saving
- **Export Functionality**: Download conversation history to CSV format
- **Real-time Status**: Live tracking of document processing and smart search preparation
- **Navigation Protection**: Prevent accidental loss of active chat sessions

## Project Structure

```
interactive-ui/
├── src/
│   ├── app.js              # Main Express server with API proxy
│   ├── public/
│   │   ├── css/
│   │   │   ├── style.css         # Core styling with animations
│   │   │   ├── dashboard.css     # Dashboard interface styling
│   │   │   ├── file-management.css # File upload and management styling
│   │   │   ├── query-interface.css # Query interface styling
│   │   │   └── chat-interface.css  # Chat interface styling
│   │   └── js/
│   │       ├── auth.js           # Authentication functionality
│   │       ├── dashboard.js      # Dashboard functionality
│   │       ├── file-management.js # File upload and management
│   │       ├── query-interface.js # Query functionality
│   │       └── chat-interface.js  # Chat functionality
│   └── views/
│       ├── login.ejs             # Login page template
│       ├── register.ejs          # Registration page template
│       ├── forgot-password.ejs   # Password reset page template
│       ├── dashboard.ejs         # Main dashboard template
│       ├── file-management.ejs   # File upload and management template
│       ├── query-interface.ejs   # Query interface template
│       └── chat-interface.ejs    # Chat interface template
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Setup Instructions

### Prerequisites

- Node.js (version 14.0.0 or higher)
- npm (comes with Node.js)
- Backend API running (see backend README for setup)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Advanced_RAG/interactive-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the frontend server:
   ```bash
   # For development with auto-reload
   npm run dev
   
   # OR for production
   npm start
   ```

2. The server will run on port 3000 by default. Access the application at:
   - Main application: http://localhost:3000
   - API Documentation: Available via backend at http://localhost:8000/docs

3. Available routes:
   - Login: http://localhost:3000/login
   - Registration: http://localhost:3000/register
   - Password Reset: http://localhost:3000/forgot-password
   - Dashboard: http://localhost:3000/dashboard (after login)
   - File Management: http://localhost:3000/file-management (after login)
   - Query Interface: http://localhost:3000/query-interface (after login)
   - Chat Interface: http://localhost:3000/chat-interface (after login)

## Key Components

### Chat Interface

The Chat Interface enables extended conversations with the RAG system about uploaded documents.

- **Session Management**: Multiple concurrent chat sessions with persistence
- **Real-time Messaging**: Immediate responses with typing indicators
- **Citation Support**: Interactive tooltips showing document sources
- **History Management**: Automatic history saving and retrieval
- **Export Functionality**: Download conversations as CSV with citations
- **Navigation Protection**: Prevents accidental session termination

### Query Interface

The Query Interface provides streamlined single-question experiences.

- **Intelligent Routing**: Automatic decision between document search and Wikipedia
- **Citation Display**: Source documents with page numbers and snippets
- **Multiple Knowledge Sources**: Support for both documents and Wikipedia
- **Follow-up Questions**: Context-aware follow-up capability

### File Management

The File Management interface handles document upload and selection.

- **Drag-and-Drop**: Intuitive document uploading with visual feedback
- **File Selection**: Select specific documents for RAG processing
- **File Details**: View document information and metadata
- **Delete Option**: Remove documents when no longer needed
- **Automatic Summarization**: View AI-generated document summaries

### Dashboard

The Dashboard provides an overview of system usage and document status.

- **User Statistics**: Document count, session count, and user details
- **System Status**: RAG initialization status monitoring
- **Quick Access**: Navigation to all application sections
- **Recent Activity**: Latest queries and document uploads

## System Architecture

### Frontend-Backend Integration

The UI connects with the FastAPI backend through a proxy middleware configuration:

```javascript
// From app.js - Proxy middleware setup
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '' // Remove /api prefix when forwarding
    }
}));
```

This allows frontend API calls to `/api/endpoint` to be automatically forwarded to the backend at `http://localhost:8000/endpoint`.

### Key Integration Points

1. **Authentication Flow**: 
   - JWT token-based authentication system
   - Token storage in localStorage with authorization headers
   - Automatic session handling and expiration

2. **Data Synchronization**:
   - Real-time status polling for long-running operations
   - Background processing updates for document indexing
   - Session state management for chat interactions

3. **Responsive Design**:
   - Mobile-first approach with flexible layouts
   - Touch-friendly UI components
   - Consistent experience across device sizes

## Configuration and Security

### Customization

The UI theme can be easily modified using CSS variables in `public/css/style.css`:

```css
:root {
  --primary-color: #6c63ff;
  --secondary-color: #4db6ac;
  --background-color: #f5f7fa;
  --text-color: #333;
}
```

Environment configuration:
- `PORT`: Server port (default: 3000)
- `BACKEND_URL`: Backend API URL (default: http://localhost:8000)

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Client and server-side validation
- **CORS Protection**: Configured for secure API requests
- **Session Management**: Automatic timeouts and secure storage
- **Content Security Policy**: Protection against XSS attacks

### Browser Compatibility

Tested and working on Chrome, Firefox, Edge, Safari and mobile browsers (iOS Safari, Chrome for Android)

## Recent Updates

Recent improvements to the UI include:

1. **Complete Chat Integration**: Fully functional chat sessions with history tracking
2. **Enhanced File Management**: Improved file upload and selection interface
3. **Improved Error Handling**: Consistent error handling across all features
4. **Real-time Status Updates**: Better feedback for long-running operations
5. **Session Management**: Support for multiple concurrent chat sessions
6. **Citation System**: Enhanced citation display with interactive tooltips
7. **Responsive Optimizations**: Improved mobile and tablet experience

## Troubleshooting

### Common Issues

1. **Authentication Problems**
   - Clear browser cache and localStorage
   - Check that the backend is running and accessible
   - Verify JWT token has not expired

2. **API Connection Errors**
   - Ensure the backend server is running on port 8000
   - Check network tab for specific API errors
   - Verify proxy settings in app.js

3. **Display Issues**
   - Test on multiple browsers if encountering rendering problems
   - Clear browser cache for CSS/JavaScript updates
   - Check console for JavaScript errors

## License

This project is licensed under the terms of the LICENSE file included in the repository.
