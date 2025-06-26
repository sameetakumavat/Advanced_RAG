# 🤖 Advanced RAG Interactive UI

A beautiful, interactive user interface for the Advanced RAG System - featuring modern design with glass morphism effects, responsive layout, and intuitive interactions for document Q&A.

> **Note:** Chat and Query interfaces are present in the UI, but are still in progress and not fully functional yet. Other features (authentication, dashboard, file management, initialization status) are implemented and stable.

## ✨ Features

- **🎨 Modern UI Design**: Glass morphism effects with interactive backgrounds
- **🔐 Complete Authentication**: Login, Registration, and Password Reset pages
- **📱 Responsive Design**: Works perfectly on all device sizes
- **⚡ Interactive Elements**: Real-time form validation and loading states
- **📊 Dashboard**: User statistics and system status monitoring
- **📂 Document Management**: Upload, view, and manage PDF documents
- **🔄 Initialization Status**: Real-time tracking of document indexing process
- **🔍 Query Interface**: Ask questions about documents and Wikipedia *(in progress, not yet complete)*
- **💬 Chat Interface**: Conversational interaction with documents *(in progress, not yet complete)*

## 🏗️ Project Structure

```
interactive-ui/
├── src/
│   ├── app.js              # Main Express server
│   ├── public/
│   │   ├── css/
│   │   │   ├── style.css         # Core styling with animations
│   │   │   ├── dashboard.css     # Dashboard interface styling
│   │   │   ├── file-management.css # File upload and management styling
│   │   │   ├── query-interface.css # Query interface styling (in progress)
│   │   │   └── chat-interface.css  # Chat interface styling (in progress)
│   │   └── js/
│   │       ├── auth.js           # Authentication functionality
│   │       ├── dashboard.js      # Dashboard statistics and real-time updates
│   │       └── file-manager.js   # File upload and initialization status tracking
│   └── views/
│       ├── login.ejs       # Login page template
│       ├── register.ejs    # Registration page template
│       ├── forgot-password.ejs # Password reset page template
│       ├── dashboard.ejs   # Main dashboard template
│       ├── file-management.ejs # File upload and management template
│       ├── query-interface.ejs # Query interface template (in progress)
│       └── chat-interface.ejs  # Chat interface template (in progress)
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (version 14.0.0 or higher)
- **npm** (comes with Node.js)

### Step 1: Install Dependencies
```powershell
# Navigate to the project directory
cd "C:\Users\sakumavat\Documents\Imp files\MCA project\Advanced_RAG\interactive-ui"

# Install all required packages
npm install
```

### Step 2: Start the Development Server
```powershell
# Start with automatic reload (recommended for development)
npm run dev

# OR start normally
npm start
```

### Step 3: Access the Application
Open your web browser and visit:
- **Main Application**: http://localhost:3000
- **Login Page**: http://localhost:3000/login  
- **Registration**: http://localhost:3000/register
- **Password Reset**: http://localhost:3000/forgot-password
- **Dashboard**: http://localhost:3000/dashboard (after login)
- **File Management**: http://localhost:3000/files (after login)
- **Query Interface**: http://localhost:3000/query (in progress, after login)
- **Chat Interface**: http://localhost:3000/chat (in progress, after login)

## 🚧 Development Status

The application is under active development as of June 2025:

- Auth, Dashboard, and File Management features are fully implemented and stable
- Query and Chat interfaces have their UI components in place but are still being connected to the backend functionality
- The proxy middleware for communicating with the FastAPI backend is configured in `app.js`

To contribute to development, focus on completing the integration between the frontend Query/Chat interfaces and their corresponding backend APIs.
