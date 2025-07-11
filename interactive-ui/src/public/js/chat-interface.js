/**
 * Enhanced Chat Interface JavaScript
 * Handles chat functionality with proper session management and citation support
 */

// Global variables
let chatHistory = [];
let assistantMessages = [];
let isRagInitialized = false;
let chatSessionActive = false;

// Document ready function
document.addEventListener('DOMContentLoaded', async function() {
    // Set up user info
    setupUserInfo();
    
    // Check RAG status
    await checkRagStatus();
    
    // Set up form handlers and key events
    setupEventListeners();
    
    // Citation backdrop click handler
    document.getElementById('citationBackdrop').addEventListener('click', hideCitationTooltip);
    
    // Initialize the session and load chat history if RAG is initialized
    if (isRagInitialized) {
        await initializeChatSession();
    }
});

/**
 * Initialize chat session
 */
async function initializeChatSession() {
    try {
        // First check if we already have a session
        const existingSessionId = localStorage.getItem('chatSessionId');
        
        if (existingSessionId) {
            console.log('Found existing chat session:', existingSessionId);
            chatSessionActive = true;
            await loadChatHistory();
            enableChatInput();
        } else if (isRagInitialized) {
            // Only create a new session if RAG is initialized and we don't have one
            const sessionCreated = await createChatSession();
            if (sessionCreated) {
                chatSessionActive = true;
                enableChatInput();
                
                // We already added the greeting message in createChatSession, so we don't need to load history here
                // This prevents duplicate messages
            }
        }
    } catch (error) {
        console.error('Error initializing chat session:', error);
    }
}

/**
 * Create a new chat session
 */
async function createChatSession() {
    try {
        // First, check if RAG is initialized - never create a session if RAG isn't ready
        if (!isRagInitialized) {
            console.log('RAG not initialized, skipping session creation');
            // Make sure we don't have any stale session IDs
            localStorage.removeItem('chatSessionId');
            return false;
        }
        
        // Check if we already have an active session
        const existingSessionId = localStorage.getItem('chatSessionId');
        if (existingSessionId) {
            console.log('Chat session already exists:', existingSessionId);
            return true;
        }
        
        // Check authentication
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return false;
        }
        
        console.log('Creating new chat session...');
        
        // Start a new chat session via API
        const response = await fetch('/api/chat/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to create chat session:', response.status);
            return false;
        }
        
        const result = await response.json();
        
        if (!result || !result.session_id) {
            console.error('Invalid session response from server');
            return false;
        }
        
        // Save session ID in localStorage
        localStorage.setItem('chatSessionId', result.session_id);
        console.log('Chat session created:', result.session_id);
        
        // If we have an answer in the response (welcome message), add it to the UI
        if (result.answer) {
            // If there's a history in the response, use that directly
            if (result.history && Array.isArray(result.history)) {
                // Clear the existing chat history
                chatHistory = [];
                
                // Process each message from history
                result.history.forEach(msg => {
                    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    const messageObj = {
                        id: messageId,
                        role: msg.role,
                        message: msg.content,
                        timestamp: msg.timestamp || new Date().toISOString(),
                        citations: msg.role === 'assistant' ? (msg.citations || []) : []
                    };
                    
                    // Add to chat history
                    chatHistory.push(messageObj);
                    
                    // Add to UI
                    addMessageToUI(messageObj);
                    
                    // Store assistant messages with citations for citation handling
                    if (msg.role === 'assistant' && msg.citations && msg.citations.length > 0) {
                        assistantMessages.push({
                            id: messageId,
                            message: messageObj.message,
                            citations: messageObj.citations
                        });
                    }
                });
            } else {
                // No history provided, just add the greeting message
                const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const messageObj = {
                    id: messageId,
                    role: 'assistant',
                    message: result.answer,
                    timestamp: new Date().toISOString(),
                    citations: result.citations || []
                };
                
                // Add to chat history and UI
                chatHistory.push(messageObj);
                addMessageToUI(messageObj);
                
                // Store the assistant's first message for citation handling
                assistantMessages.push({
                    id: messageId,
                    message: result.answer,
                    citations: result.citations || []
                });
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error creating chat session:', error);
        return false;
    }
}

/**
 * Set up user information
 */
function setupUserInfo() {
    // Load username from localStorage
    const username = localStorage.getItem('username') || 'User';
    document.getElementById('username').textContent = username;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    try {
        const chatForm = document.getElementById('chatForm');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        const exportChatButton = document.querySelector('.export-chat-btn');
        const clearChatButton = document.querySelector('.clear-chat-btn');
        const dashboardButton = document.querySelector('.back-btn');
        const fileManagementButton = document.querySelector('.btn-file-management');
        
        // Chat form submission
        chatForm.addEventListener('submit', sendMessage);
        
        // Auto-resize text area and handle placeholder
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // Update send button state
            sendButton.disabled = this.value.trim().length === 0;
            
            // Handle placeholder visibility
            const placeholder = document.getElementById('inputPlaceholder');
            if (placeholder) {
                placeholder.style.visibility = this.value.trim().length > 0 ? 'hidden' : 'visible';
            }
        });
        
        // Key events for textarea
        chatInput.addEventListener('keydown', function(e) {
            // Submit on Enter without Shift
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendButton.disabled) {
                    chatForm.dispatchEvent(new Event('submit'));
                }
            }
        });
        
        // Button event handlers
        if (clearChatButton) {
            clearChatButton.addEventListener('click', showClearConfirmation);
        }
        
        if (exportChatButton) {
            exportChatButton.addEventListener('click', exportChatHistory);
        }
        
        if (dashboardButton) {
            dashboardButton.addEventListener('click', () => handleNavigation('/dashboard'));
        }
        
        if (fileManagementButton) {
            fileManagementButton.addEventListener('click', () => handleNavigation('/file-management'));
        }
        
        // Handle beforeunload event to prevent accidental browser/tab closing
        // We'll set a flag to distinguish between internal navigation and browser closing
        window.isInternalNavigation = false;
        
        window.addEventListener('beforeunload', function(e) {
            // Only show confirmation if it's not internal navigation
            if (!window.isInternalNavigation && chatSessionActive && chatHistory.length > 0) {
                // Modern browsers don't show custom messages, but this triggers the confirmation dialog
                e.preventDefault();
                e.returnValue = '';
            }
        });
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Handle navigation with confirmation if needed
 */
function handleNavigation(destination = '/dashboard') {
    // Set flag to indicate this is internal navigation
    window.isInternalNavigation = true;
    
    // Always preserve the chat session when navigating, don't end it
    // Just navigate directly to the destination page
    window.location.href = destination;
    
    // Note: We no longer ask for confirmation or end the chat session
    // This allows users to return to their active session later
}

/**
 * Show leave confirmation modal
 */
function showLeaveConfirmation(destination) {
    // Create modal elements if they don't exist
    if (!document.getElementById('leaveConfirmationModal')) {
        const modalHTML = `
            <div class="modal-overlay" id="leaveConfirmationBackdrop"></div>
            <div class="modal-container" id="leaveConfirmationModal">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> End Chat Session?</h3>
                    <button class="modal-close" id="closeLeaveModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>You're about to leave this chat session. Would you like to export your conversation before ending the session?</p>
                    <p>Your chat history won't be accessible after ending this session.</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-cancel" id="stayInChatBtn">
                        <i class="fas fa-times"></i> Stay in Chat
                    </button>
                    <button class="modal-btn modal-btn-end" id="leaveWithoutExportBtn">
                        <i class="fas fa-sign-out-alt"></i> End Session
                    </button>
                    <button class="modal-btn modal-btn-export" id="exportAndLeaveBtn">
                        <i class="fas fa-file-export"></i> Export & End
                    </button>
                </div>
            </div>
        `;
        
        // Add to document
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        while (tempDiv.firstChild) {
            document.body.appendChild(tempDiv.firstChild);
        }
        
        // Set up event handlers for the modal
        document.getElementById('closeLeaveModal').addEventListener('click', hideLeaveConfirmation);
        document.getElementById('stayInChatBtn').addEventListener('click', hideLeaveConfirmation);
        document.getElementById('leaveWithoutExportBtn').addEventListener('click', async () => {
            await endChatSession();
            window.location.href = destination;
        });
        document.getElementById('exportAndLeaveBtn').addEventListener('click', async () => {
            await exportChatHistory();
            await endChatSession();
            window.location.href = destination;
        });
        
        // Close when clicking backdrop
        document.getElementById('leaveConfirmationBackdrop').addEventListener('click', hideLeaveConfirmation);
    }
    
    // Store destination for later use
    document.getElementById('leaveConfirmationModal').dataset.destination = destination;
    
    // Show the modal
    document.getElementById('leaveConfirmationBackdrop').style.display = 'block';
    document.getElementById('leaveConfirmationModal').style.display = 'block';
}

/**
 * Hide leave confirmation modal
 */
function hideLeaveConfirmation() {
    const backdrop = document.getElementById('leaveConfirmationBackdrop');
    const modal = document.getElementById('leaveConfirmationModal');
    
    if (backdrop && modal) {
        backdrop.style.display = 'none';
        modal.style.display = 'none';
    }
}

/**
 * Show clear confirmation modal
 */
function showClearConfirmation() {
    // If no active session or empty history, nothing to clear
    if (!chatSessionActive || chatHistory.length === 0) {
        showToast('No messages to clear.', 'info');
        return;
    }
    
    // Create modal elements if they don't exist
    if (!document.getElementById('clearConfirmationModal')) {
        const modalHTML = `
            <div class="confirmation-modal-backdrop" id="clearConfirmationBackdrop"></div>
            <div class="confirmation-modal" id="clearConfirmationModal">
                <div class="modal-header">
                    <h3><i class="fas fa-trash"></i> Clear Chat History?</h3>
                    <button class="modal-close" id="closeClearModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to clear the current chat history?</p>
                    <p>This action will remove all messages from the current session but keep the session active.</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-modal btn-stay" id="cancelClearBtn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="btn-modal btn-export-leave" id="exportBeforeClearBtn">
                        <i class="fas fa-file-export"></i> Export First
                    </button>
                    <button class="btn-modal btn-leave" id="confirmClearBtn">
                        <i class="fas fa-trash"></i> Clear Chat
                    </button>
                </div>
            </div>
        `;
        
        // Add to document
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        while (tempDiv.firstChild) {
            document.body.appendChild(tempDiv.firstChild);
        }
        
        // Set up event handlers for the modal
        document.getElementById('closeClearModal').addEventListener('click', hideClearConfirmation);
        document.getElementById('cancelClearBtn').addEventListener('click', hideClearConfirmation);
        document.getElementById('exportBeforeClearBtn').addEventListener('click', async () => {
            await exportChatHistory();
            hideClearConfirmation();
        });
        document.getElementById('confirmClearBtn').addEventListener('click', async () => {
            await clearChatHistory();
            hideClearConfirmation();
        });
        
        // Close when clicking backdrop
        document.getElementById('clearConfirmationBackdrop').addEventListener('click', hideClearConfirmation);
    }
    
    // Show the modal
    document.getElementById('clearConfirmationBackdrop').style.display = 'block';
    document.getElementById('clearConfirmationModal').style.display = 'block';
}

/**
 * Check if RAG is initialized
 */
async function checkRagStatus() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }
        
        const response = await fetch('/api/chain/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to check RAG status');
        }
        
        const result = await response.json();
        isRagInitialized = result.initialized;
        
        // Update UI
        updateRagStatusUI(isRagInitialized);
        
        // Store RAG status
        localStorage.setItem('ragInitialized', isRagInitialized);
        
        return isRagInitialized;
    } catch (error) {
        console.error('Error checking RAG status:', error);
        updateRagStatusUI(false);
        return false;
    }
}

/**
 * Update document status UI
 */
function updateRagStatusUI(isInitialized) {
    const ragStatusElement = document.getElementById('ragStatus');
    const ragStatusText = document.getElementById('ragStatusText');
    const ragStatusWarning = document.getElementById('ragStatusWarning');
    const chatArea = document.querySelector('.chat-area');
    
    if (ragStatusElement && ragStatusText) {
        if (isInitialized) {
            ragStatusElement.className = 'rag-status initialized';
            ragStatusText.textContent = 'Documents Ready';
            
            if (ragStatusWarning) {
                ragStatusWarning.style.display = 'none';
            }
            
            // Show chat area and enable input
            if (chatArea) {
                chatArea.style.display = 'flex';
            }
            
            enableChatInput();
        } else {
            ragStatusElement.className = 'rag-status not-initialized';
            ragStatusText.textContent = 'RAG Not Initialized';
            
            if (ragStatusWarning) {
                ragStatusWarning.style.display = 'flex';
            }
            
            // Hide chat area when RAG is not initialized
            if (chatArea) {
                chatArea.style.display = 'none';
            }
            
            disableChatInput();
        }
    }
}

/**
 * Enable chat input
 */
function enableChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = '';
        document.getElementById('inputPlaceholder').style.visibility = 'visible';
    }
}

/**
 * Disable chat input
 */
function disableChatInput() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = '';
        document.getElementById('inputPlaceholder').style.visibility = 'visible';
    }
    
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.disabled = true;
    }
}

/**
 * Send a message
 */
async function sendMessage(event) {
    event.preventDefault();
    
    // Get the message text
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message || !isRagInitialized) {
        return;
    }
    
    // Clear input and reset height
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Disable the send button
    document.getElementById('sendButton').disabled = true;
    
    // Create a new session if we don't have one
    if (!localStorage.getItem('chatSessionId') && isRagInitialized) {
        await createChatSession();
    }
    
    // Get session ID (should be created by now)
    const sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
        console.error('No chat session available');
        showToast('Error: No active chat session', 'error');
        return;
    }
    
    // Add user message to UI immediately but don't add to history since the backend will return it
    // Create a temporary display-only message
    const tempMessageObj = {
        id: 'temp_' + Date.now(),
        role: 'user',
        message: message,
        citations: [],
        timestamp: new Date().toISOString(),
        isTemp: true // Mark as temporary
    };
    
    // Just add to UI, not to history
    addMessageToUI(tempMessageObj);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send message to API following the expected format in chat_route.py
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                session_id: sessionId,
                message: message 
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // The API returns: session_id, answer, citations, and history
        console.log('Message response:', data);
        
        // Check for valid session ID and update if needed
        if (data.session_id && data.session_id !== sessionId) {
            console.log('Updating session ID to:', data.session_id);
            localStorage.setItem('chatSessionId', data.session_id);
        }
        
        // Instead of manually adding messages, use the history from the API response
        if (data.history && Array.isArray(data.history)) {
            // Clear existing messages from UI
            const chatMessagesElement = document.getElementById('chatMessages');
            // Keep the empty chat div if it exists
            const emptyChat = document.getElementById('emptyChat');
            chatMessagesElement.innerHTML = '';
            if (emptyChat) {
                chatMessagesElement.appendChild(emptyChat);
            }
            
            // Clear existing chat history
            chatHistory = [];
            assistantMessages = [];
            
            // Process the entire history from the API
            data.history.forEach(msg => {
                // Convert backend format to frontend format
                const messageObj = {
                    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    role: msg.role,
                    message: msg.content,
                    timestamp: msg.timestamp || new Date().toISOString(),
                    // Use the citations from the individual message if available
                    citations: msg.role === 'assistant' ? (msg.citations || []) : []
                };
                
                // Add to chat history
                chatHistory.push(messageObj);
                
                // If it's the assistant's message with citations, add to assistantMessages
                if (msg.role === 'assistant' && messageObj.citations.length > 0) {
                    assistantMessages.push({
                        id: messageObj.id,
                        message: messageObj.message,
                        citations: messageObj.citations
                    });
                }
                
                // Add to UI
                addMessageToUI(messageObj);
            });
        }
        
        // Re-enable the chat input
        document.getElementById('sendButton').disabled = false;
        chatInput.focus();
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        showToast('Error sending message. Please try again.', 'error');
        document.getElementById('sendButton').disabled = false;
    }
}

/**
 * Add a message to the chat
 */
function addMessageToChat(role, message, citations = []) {
    // Get current time for timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Generate a unique ID for this message (for citation tracking)
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create message object
    const messageObj = {
        id: messageId,
        role,
        message,
        citations,
        timestamp: new Date().toISOString() // Store ISO timestamp for exports
    };
    
    // Add to chat history
    chatHistory.push(messageObj);
    
    // If it's an assistant message with citations, add to assistantMessages
    if (role === 'assistant' && citations && citations.length > 0) {
        assistantMessages.push({
            id: messageId,
            message,
            citations
        });
    }
    
    // Add to UI
    addMessageToUI(messageObj);
    
    // Handle message formatting and citations
    let formattedMessage = message;
    let citationsHtml = '';
    
    if (role === 'assistant' && citations && citations.length > 0) {
        // Process message to add citation markers
        formattedMessage = processMessageWithCitations(message, citations);
        
        // Create citations list
        citationsHtml = `
            <div class="message-citations">
                <span>Citations:</span>
                ${citations.map((cit, index) => {
                    // Use source_id from citation if available, otherwise use index+1
                    const displayId = cit.source_id !== undefined ? cit.source_id : index + 1;
                    return `<button class="citation" onclick="showCitationDetails(${index})">[${displayId}]</button>`;
                }).join(' ')}
            </div>
        `;
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.innerHTML = `
        <div class="message-avatar">
            ${role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="message-content">
            <div class="message-text">${formattedMessage}</div>
            ${citationsHtml}
            <div class="message-time">${timestamp}</div>
        </div>
    `;
    
    // Add to chat container
    const chatMessagesElement = document.getElementById('chatMessages');
    
    // Add message to container
    chatMessagesElement.appendChild(messageEl);
    
    // Scroll to bottom
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
    
    // Only add non-temporary messages to chat history if they're not already being tracked
    if (!isTemp && !chatHistory.some(m => m.id === messageId)) {
        console.log('Adding to chat history:', role, messageId);
        chatHistory.push({
            id: messageId,
            role,
            message,
            citations,
            timestamp: entry.timestamp || new Date().toISOString(),
        });
    }
}

/**
 * Process message with citations
 */
function processMessageWithCitations(message, citations, messageId = null) {
    let processedMessage = message;
    
    // Process citations in the message
    citations.forEach((citation, index) => {
        if (!citation.text_span) return;
        
        // Get text span information
        const span = citation.text_span;
        const spanContent = message.substring(span.start, span.end);
        
        // Don't process if span is invalid
        if (!spanContent) return;
        
        // Replace the text with a cited version
        const beforeSpan = processedMessage.substring(0, span.start);
        const afterSpan = processedMessage.substring(span.end);
        
        // Get the source_id from citation (this is the actual citation number from the API)
        // If source_id is not available, fall back to the index
        const sourceId = citation.source_id !== undefined ? citation.source_id : index;
        
        // Include messageId parameter for historical messages
        const onClickHandler = messageId 
            ? `showCitationDetails(${index}, '${messageId}')`
            : `showCitationDetails(${index})`;
            
        // Use the source_id for display to match the citation numbers in the API response
        processedMessage = `${beforeSpan}<span class="cited-text">${spanContent}</span><sup class="citation-ref" onclick="${onClickHandler}">[${sourceId}]</sup>${afterSpan}`;
    });
    
    return processedMessage;
}

/**
 * Show citation details tooltip
 * @param {number} index - The citation index
 * @param {string|null} messageId - Optional message ID for historical messages
 */
function showCitationDetails(index, messageId = null) {
    console.log('Showing citation:', index, 'Message ID:', messageId);
    console.log('Assistant Messages:', assistantMessages);
    
    // Check if we have any messages with citations
    if (!assistantMessages || !assistantMessages.length) {
        console.error('No assistant messages with citations found');
        return;
    }
    
    let targetMessage;
    
    if (messageId) {
        console.log('Looking for message with ID:', messageId);
        // Find the specific message by ID for historical messages
        targetMessage = assistantMessages.find(msg => msg.id === messageId);
        console.log('Found message:', targetMessage);
    } else {
        // Default to the latest message
        targetMessage = assistantMessages[assistantMessages.length - 1];
        console.log('Using latest message:', targetMessage);
    }
    
    // Check if the message has citations
    if (!targetMessage || !targetMessage.citations) {
        console.error('No citations found in the target message');
        return;
    }
    
    const citations = targetMessage.citations;
    console.log('Citations array:', citations);
    
    // Check if the citation index is valid
    if (index >= citations.length) {
        console.error('Citation index out of bounds');
        return;
    }
    
    const citation = citations[index];
    console.log('Citation details:', citation);
    
    // Access tooltip elements
    const tooltip = document.getElementById('citationTooltip');
    const backdrop = document.getElementById('citationBackdrop');
    const tooltipTitle = document.getElementById('tooltipTitle');
    const tooltipContent = document.getElementById('tooltipContent');
    const tooltipActions = document.getElementById('tooltipActions');
    
    if (!tooltip || !backdrop || !tooltipTitle || !tooltipContent) {
        console.error('Citation tooltip elements not found in DOM');
        return;
    }
    
    // Set tooltip title - use source_id from API if available, otherwise use index+1
    // We use the ::before CSS pseudo-element for the book icon, so just update the text
    tooltipTitle.textContent = `Citation [${citation.source_id !== undefined ? citation.source_id : index + 1}]`;
    
    // Handle different possible citation formats
    // API response format example from user's sample:
    // {
    //   "source_id": 1,
    //   "page": 63,
    //   "page_label": "64",
    //   "source": "c:\\Users\\...\\100CommonBirdsofIndiaUpdated.pdf",
    //   "page_content": "100 Common Birds in India..."
    // }
    
    // Extract citation details
    const source = citation.source || '';
    const pageContent = citation.page_content || '';
    const page = citation.page || citation.page_label || '';
    const sourceId = citation.source_id || '';
    
    // Get source filename
    let sourceName = 'Unknown Source';
    if (source) {
        // Extract filename from path
        const pathParts = source.split(/[\\\/]/);
        sourceName = pathParts[pathParts.length - 1] || source;
        
        // Remove any URL encoding
        try {
            sourceName = decodeURIComponent(sourceName);
        } catch (e) {
            console.warn('Failed to decode source name:', e);
        }
    }
    
    // Build tooltip content HTML
    let contentHTML = `
        <div class="citation-source">
            <div class="source-icon"><i class="fas fa-file-alt"></i></div>
            <div class="source-details">
                <div class="source-name">${sourceName}</div>
                ${page ? `<div class="source-page">Page ${page}</div>` : ''}
            </div>
        </div>
    `;
    
    // Content preview
    if (pageContent) {
        contentHTML += `
            <div class="citation-preview">
                <div class="preview-label">Content from Source:</div>
                <div class="preview-text">${pageContent}</div>
            </div>
        `;
    }
    
    // Set the tooltip content
    tooltipContent.innerHTML = contentHTML;
    
    // Clear any actions
    tooltipActions.innerHTML = '';
    
    // Reset any custom positioning
    tooltip.style.left = '50%';
    tooltip.style.top = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    
    // Make sure backdrop is behind tooltip
    backdrop.style.zIndex = '1000';
    tooltip.style.zIndex = '2000';
    
    // Show both backdrop and tooltip
    backdrop.style.display = 'block';
    tooltip.style.display = 'flex'; // Using flex for better layout
    
    // Force browser to redraw
    void tooltip.offsetWidth;
}

/**
 * Hide citation tooltip
 */
function hideCitationTooltip() {
    document.getElementById('citationBackdrop').style.display = 'none';
    document.getElementById('citationTooltip').style.display = 'none';
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

/**
 * Clear chat history
 */
async function clearChatHistory() {
    try {
        const chatMessagesElement = document.getElementById('chatMessages');
        const emptyChat = document.getElementById('emptyChat');
        
        // Clear UI
        chatMessagesElement.innerHTML = '';
        
        // Add empty state back
        if (emptyChat) {
            chatMessagesElement.appendChild(emptyChat);
            emptyChat.style.display = 'flex';
        } else {
            // Create new empty state if it doesn't exist
            const newEmptyChat = document.createElement('div');
            newEmptyChat.id = 'emptyChat';
            newEmptyChat.className = 'empty-chat';
            newEmptyChat.innerHTML = `
                <div class="empty-chat-icon">💬</div>
                <h3>Start chatting with your documents</h3>
                <p>Ask questions and get AI-powered answers with citations.</p>
            `;
            chatMessagesElement.appendChild(newEmptyChat);
        }
        
        // Reset chat history and assistant messages arrays
        chatHistory = [];
        assistantMessages = [];
        
        // We don't end the session, just clear the UI
        showToast('Chat history cleared', 'success');
        
        return true;
    } catch (error) {
        console.error('Error clearing chat history:', error);
        showToast('Error clearing chat history', 'error');
        return false;
    }
}

/**
 * Export chat history
 */
function exportChatHistory() {
    try {
        // If no messages, show a message and return
        if (chatHistory.length === 0) {
            showToast('No messages to export', 'info');
            return;
        }
        
        const timestamp = new Date().toLocaleString();
        
        // Create CSV content
        let csvContent = "Role,Message,Timestamp,Citations\n";
        
        // Add each message to CSV
        chatHistory.forEach(entry => {
            // Format message for CSV (escape quotes, etc.)
            let messageContent = entry.message.replace(/"/g, '""');
            
            // Format citations
            let citationsText = '';
            if (entry.citations && entry.citations.length > 0) {
                citationsText = entry.citations.map(c => {
                    return c.source ? c.source.split('/').pop() : 'Unknown';
                }).join(', ');
            }
            
            // Add to CSV
            csvContent += `"${entry.role}","${messageContent}","${entry.timestamp}","${citationsText}"\n`;
        });
        
        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `chat-export-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        
        showToast('Chat history exported', 'success');
    } catch (error) {
        console.error('Error exporting chat history:', error);
        showToast('Error exporting chat history', 'error');
    }
}

/**
 * Navigate to Dashboard
 */
function goToDashboard() {
    const sessionId = localStorage.getItem('chatSessionId');
    if (sessionId && chatHistory && chatHistory.length > 0) {
        // Show confirmation if we have an active session
        showLeaveConfirmation('/dashboard');
    } else {
        // Navigate directly if no active session
        navigateWithLoading('/dashboard');
    }
}

/**
 * Navigate to File Management
 */
function goToFileManagement() {
    const sessionId = localStorage.getItem('chatSessionId');
    if (sessionId && chatHistory && chatHistory.length > 0) {
        // Show confirmation if we have an active session
        showLeaveConfirmation('/file-management');
    } else {
        // Navigate directly if no active session
        navigateWithLoading('/file-management');
    }
}

/**
 * Navigate with loading animation
 */
function navigateWithLoading(url) {
    // Show loading overlay
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    // Update loading message
    const loadingMessage = document.querySelector('#loadingOverlay p');
    if (loadingMessage) {
        loadingMessage.textContent = 'Redirecting...';
    }
    
    // Redirect after a short delay for animation
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '10000';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 
                           type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Style toast
    toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                            type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
                            type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)';
    toast.style.color = 'white';
    toast.style.padding = '10px 15px';
    toast.style.borderRadius = '8px';
    toast.style.marginTop = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.display = 'flex';
    toast.style.justifyContent = 'space-between';
    toast.style.alignItems = 'center';
    toast.style.minWidth = '300px';
    toast.style.maxWidth = '450px';
    toast.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 2.7s forwards';
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '1.2rem';
    closeButton.style.cursor = 'pointer';
    
    // Close event
    closeButton.addEventListener('click', () => {
        toastContainer.removeChild(toast);
    });
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toastContainer.removeChild(toast);
        }
    }, 3000);
}

/**
 * Load chat history from API
 */
async function loadHistoryFromAPI(sessionId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return null;
        }
        
        console.log('Loading chat history from API for session:', sessionId);
        
        const response = await fetch(`/api/chat/history/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The backend returns an array of messages directly
        if (Array.isArray(data)) {
            // Check if we already have messages in the UI
            const hasExistingMessages = chatHistory.length > 0;
            
            // If we have messages already and this is loading history,
            // we'll prevent duplicate greeting messages
            const firstGreeting = hasExistingMessages && 
                data.length > 0 && 
                data[0].role === 'assistant' && 
                data[0].content.includes("Hello! I'm ready to help");
                
            // Transform the backend message format to our frontend format
            return data
                // Skip the first greeting message if we already have messages
                .filter((msg, index) => !(hasExistingMessages && index === 0 && firstGreeting))
                .map(msg => {
                    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    const messageObj = {
                        id: messageId,
                        role: msg.role,
                        message: msg.content,
                        timestamp: msg.timestamp || new Date().toISOString(),
                        citations: msg.role === 'assistant' ? (msg.citations || []) : []
                    };
                    
                    // Store assistant messages with citations for citation handling
                    if (msg.role === 'assistant' && messageObj.citations && messageObj.citations.length > 0) {
                        assistantMessages.push({
                            id: messageId,
                            message: messageObj.message,
                            citations: messageObj.citations
                        });
                    }
                    
                    return messageObj;
                });
        }
        
        return [];
    } catch (error) {
        console.error('Error loading chat history from API:', error);
        return null;
    }
}

/**
 * Load chat history
 */
async function loadChatHistory() {
    try {
        // Always completely clear the chat UI first
        const chatMessagesElement = document.getElementById('chatMessages');
        // Get a reference to the empty chat div
        const emptyChat = document.getElementById('emptyChat');
        
        // Clear everything from the chat container
        chatMessagesElement.innerHTML = '';
        
        // Re-add the empty chat div
        if (emptyChat) {
            chatMessagesElement.appendChild(emptyChat);
        } else {
            // Create empty chat div if it doesn't exist
            const newEmptyChat = document.createElement('div');
            newEmptyChat.id = 'emptyChat';
            newEmptyChat.className = 'empty-chat';
            newEmptyChat.innerHTML = `
                <div class="empty-chat-icon">💬</div>
                <h3>Start chatting with your documents</h3>
                <p>Ask questions and get AI-powered answers with citations.</p>
            `;
            chatMessagesElement.appendChild(newEmptyChat);
        }
        
        // Reset chat history and assistant messages arrays
        chatHistory = [];
        assistantMessages = [];
        
        // Check if we have a valid session ID
        const sessionId = localStorage.getItem('chatSessionId');
        
        if (sessionId) {
            console.log('Loading chat history for session:', sessionId);
            
            // Only load history from API, never from localStorage
            const apiHistory = await loadHistoryFromAPI(sessionId);
            
            // Only process valid API responses
            if (apiHistory && Array.isArray(apiHistory) && apiHistory.length > 0) {
                // We successfully loaded valid history from API
                chatHistory = apiHistory;
                
                // Hide empty chat message
                const currentEmptyChat = document.getElementById('emptyChat');
                if (currentEmptyChat) {
                    currentEmptyChat.style.display = 'none';
                }
                
                // Add messages to UI
                chatHistory.forEach(entry => {
                    if (entry && entry.role && entry.message) {
                        addMessageToUI(entry);
                    }
                });
                
                // Build assistantMessages array (only with valid entries)
                assistantMessages = chatHistory
                    .filter(entry => entry && entry.role === 'assistant' && entry.citations)
                    .map(entry => ({
                        id: entry.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                        message: entry.message,
                        citations: entry.citations || []
                    }));
                
                console.log('Chat history loaded from API:', chatHistory.length, 'messages');
                chatSessionActive = true;
                return;
            } else {
                console.log('No valid history found from API');
                // Clear the invalid session ID
                localStorage.removeItem('chatSessionId');
            }
        } else {
            console.log('No session ID found, starting fresh chat');
        }
        
        // Always show empty state when no history is loaded
        const currentEmptyChat = document.getElementById('emptyChat');
        if (currentEmptyChat) {
            currentEmptyChat.style.display = 'flex';
        }
        
        chatSessionActive = false;
    } catch (error) {
        console.error('Error loading chat history:', error);
        showToast('Error loading chat history', 'error');
    }
}

/**
 * Add a message to the UI without adding it to the chat history
 * Used for loading existing messages from API
 */
function addMessageToUI(entry) {
    if (!entry || !entry.role || !entry.message) {
        console.error('Invalid message entry', entry);
        return;
    }
    
    const { role, message, citations, id, isTemp } = entry;
    const messageId = id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('Adding message to UI:', role, messageId, isTemp ? '(temp)' : '');
    
    // Format timestamp
    const timestamp = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Hide empty chat if we're showing messages
    const emptyChat = document.getElementById('emptyChat');
    if (emptyChat) {
        emptyChat.style.display = 'none';
    }
    
    // Handle message formatting and citations
    let formattedMessage = message;
    let citationsHtml = '';
    
    if (role === 'assistant' && citations && citations.length > 0) {
        // Process message to add citation markers with message ID
        formattedMessage = processMessageWithCitations(message, citations, messageId);
        
        // Create citations list with message ID for proper reference
        citationsHtml = `
            <div class="message-citations">
                <span>Citations:</span>
                ${citations.map((cit, index) => {
                    // Use source_id from citation if available, otherwise use index+1
                    const displayId = cit.source_id !== undefined ? cit.source_id : index + 1;
                    return `<button class="citation" onclick="showCitationDetails(${index}, '${messageId}')">[${displayId}]</button>`;
                }).join(' ')}
            </div>
        `;
    }
    
    // Create message element with a data-id attribute for potential future reference
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.setAttribute('data-message-id', messageId);
    if (isTemp) {
        messageEl.setAttribute('data-temp', 'true');
    }
    
    messageEl.innerHTML = `
        <div class="message-avatar">
            ${role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="message-content">
            <div class="message-text">${formattedMessage}</div>
            ${citationsHtml}
            <div class="message-time">${timestamp}</div>
        </div>
    `;
    
    // Add to chat container
    const chatMessagesElement = document.getElementById('chatMessages');
    chatMessagesElement.appendChild(messageEl);
    
    // Scroll to bottom
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

/**
 * End the current chat session
 */
async function endChatSession() {
    try {
        const sessionId = localStorage.getItem('chatSessionId');
        if (!sessionId) {
            console.log('No active session to end');
            return;
        }
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token, cannot end session properly');
            // Still clean up local storage
            localStorage.removeItem('chatSessionId');
            localStorage.removeItem('chatHistory');
            return;
        }
        
        console.log('Ending chat session:', sessionId);
        
        // Call the API to end the session
        const response = await fetch(`/api/chat/end/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to end session on server:', response.status);
        }
        
        // Clear all chat data from localStorage
        localStorage.removeItem('chatSessionId');
        localStorage.removeItem('chatHistory');
        
        // Reset UI state
        chatHistory = [];
        assistantMessages = [];
        chatSessionActive = false;
        
        // Show empty state
        const chatMessagesElement = document.getElementById('chatMessages');
        const emptyChat = document.getElementById('emptyChat');
        
        if (emptyChat) {
            // Make sure chat is cleared and empty state is visible
            chatMessagesElement.innerHTML = '';
            chatMessagesElement.appendChild(emptyChat);
            emptyChat.style.display = 'flex';
        }
        
        console.log('Chat session ended');
        showToast('Chat session ended', 'info');
    } catch (error) {
        console.error('Error ending chat session:', error);
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Show loading overlay
        document.getElementById('loadingOverlay').style.display = 'flex';
        
        // End chat session if exists
        await endChatSession();
        
        // Clear auth data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('ragInitialized');
        localStorage.removeItem('chatSessionId');
        localStorage.removeItem('chatHistory');
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = '/login';
        }, 500);
    }
}

/**
 * Show the End Chat modal
 */
function showEndChatModal() {
    document.getElementById('endChatModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Hide the End Chat modal
 */
function hideEndChatModal() {
    document.getElementById('endChatModal').style.display = 'none';
    document.body.style.overflow = '';
}

/**
 * End chat and export the history
 */
async function endChatWithExport() {
    // First export
    await exportChatHistory();
    
    // Then end the session
    await endChatSession();
    
    // Direct redirect to dashboard to avoid potential issues
    navigateWithLoading('/dashboard');
}

/**
 * End chat without exporting
 */
async function endChatWithoutExport() {
    await endChatSession();
    
    // Direct redirect to dashboard to avoid potential issues
    navigateWithLoading('/dashboard');
}

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

.toast {
    animation: fadeIn 0.3s ease-out;
}

@keyframes tooltipFadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

@keyframes backdropFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;
document.head.appendChild(styleSheet);
