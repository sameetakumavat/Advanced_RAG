// Import required modules
const express = require('express'); // Import Express framework
const path = require('path'); // Import path module for file path operations
const bodyParser = require('body-parser'); // Import body-parser to parse incoming request bodies
const { createProxyMiddleware } = require('http-proxy-middleware'); // Import proxy middleware

// Initialize the Express application
const app = express();

// Set the view engine to EJS and views directory
app.set('view engine', 'ejs'); // Use EJS as the templating engine
app.set('views', path.join(__dirname, 'views')); // Set views directory path

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files such as CSS, JS and images

// Backend API proxy - Forward all /api requests to FastAPI backend
// IMPORTANT: This must come BEFORE body-parser middleware to avoid conflicts
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    timeout: 30000,
    pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to backend
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(500).json({ 
            error: 'Backend server unavailable',
            message: 'Please ensure the backend server is running on port 8000'
        });
    }
}));

// Set up middleware for non-API routes
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(bodyParser.json()); // Parse JSON bodies

// Define authentication routes without external dependency for now
app.get('/', (req, res) => {
    res.render('login'); // Render the login page on the home route
});

app.get('/login', (req, res) => {
    res.render('login'); // Render the login page
});

app.get('/register', (req, res) => {
    res.render('register'); // Render the registration page
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password'); // Render the forgot password page
});

// Dashboard and main application routes
app.get('/dashboard', (req, res) => {
    res.render('dashboard'); // Render the dashboard page
});

app.get('/file-management', (req, res) => {
    res.render('file-management'); // Render the file management page
});

app.get('/query-interface', (req, res) => {
    res.render('query-interface'); // Render the query interface page
});

app.get('/chat-interface', (req, res) => {
    res.render('chat-interface'); // Render the chat interface page
});

// Handle authentication form submissions (these are handled by frontend JS)
// The actual API calls go through the proxy middleware above

// Start the server
const PORT = process.env.PORT || 3000; // Use the port from environment variables or default to 3000
app.listen(PORT, () => {
    console.log(`🚀 Advanced RAG Auth Server is running on port ${PORT}`); // Log message indicating server is running
    console.log(`📱 Access the application at: http://localhost:${PORT}`);
});