/**
 * Query Interface JavaScript
 * Manages the query interface functionality for the Advanced RAG System
 */

// Global variables
let selectedQAMode = null;
let ragStatus = { initialized: false, message: "Checking..." };
let currentAnswer = "";
let currentCitations = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 QA Interface page loaded');
    loadUserInfo();
    checkRAGStatus();
    
    // Set up auto-save functionality
    setupAutoSave();
    
    // Set up citation tooltip close button
    setupCitationHandlers();
});

/**
 * Set up auto-save functionality
 */
function setupAutoSave() {
    const questionInput = document.getElementById('questionInput');
    
    // Restore last query on page load
    const lastQuery = localStorage.getItem('lastQuery');
    if (lastQuery) {
        questionInput.value = lastQuery;
    }
    
    // Auto-save query on input
    questionInput.addEventListener('input', function() {
        localStorage.setItem('lastQuery', this.value);
    });
}

/**
 * Load user information
 */
function loadUserInfo() {
    const username = localStorage.getItem('username') || 'User';
    document.getElementById('username').textContent = username;
}

/**
 * Check RAG system status
 */
async function checkRAGStatus() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/chain/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            ragStatus = await response.json();
        } else {
            ragStatus = { initialized: false, message: "RAG resources not initialized" };
        }
    } catch (error) {
        console.error('Error checking RAG status:', error);
        ragStatus = { initialized: false, message: "RAG resources not initialized" };
    }

    updateRAGStatusUI();
}

/**
 * Update RAG status in UI
 */
function updateRAGStatusUI() {
    const docStatusIndicator = document.getElementById('docStatusIndicator');
    const docStatusText = document.getElementById('docStatusText');
    const docQABtn = document.getElementById('docQABtn');
    const hybridStatusIndicator = document.getElementById('hybridStatusIndicator');
    const hybridStatusText = document.getElementById('hybridStatusText');
    const hybridQABtn = document.getElementById('hybridQABtn');
    const ragWarning = document.getElementById('ragWarning');

    if (ragStatus.initialized) {
        // RAG is initialized
        docStatusIndicator.className = 'status-indicator success';
        docStatusText.textContent = 'RAG system ready';
        docQABtn.disabled = false;
        docQABtn.textContent = 'Select Mode';
        
        hybridStatusIndicator.className = 'status-indicator success';
        hybridStatusText.textContent = 'RAG system ready';
        hybridQABtn.disabled = false;
        hybridQABtn.textContent = 'Select Mode';
        
        ragWarning.style.display = 'none';
    } else {
        // RAG not initialized
        docStatusIndicator.className = 'status-indicator error';
        docStatusText.textContent = ragStatus.message || 'RAG not initialized';
        docQABtn.disabled = true;
        docQABtn.textContent = 'Not Available';
        
        hybridStatusIndicator.className = 'status-indicator error';
        hybridStatusText.textContent = ragStatus.message || 'RAG not initialized';
        hybridQABtn.disabled = true;
        hybridQABtn.textContent = 'Not Available';
        
        ragWarning.style.display = 'block';
    }
}

/**
 * Select QA mode
 */
function selectQAMode(mode) {
    // Check if mode is available
    if ((mode === 'documents' || mode === 'hybrid') && !ragStatus.initialized) {
        showToast('Please initialize RAG system first', 'warning');
        return;
    }

    selectedQAMode = mode;
    
    // Hide mode selection, show selected mode and question form
    document.querySelector('.qa-modes').style.display = 'none';
    document.getElementById('selectedMode').style.display = 'flex';
    document.getElementById('questionForm').style.display = 'block';
    
    // Update selected mode display
    const selectedModeDiv = document.getElementById('selectedMode');
    const selectedModeIcon = document.getElementById('selectedModeIcon');
    const selectedModeText = document.getElementById('selectedModeText');
    
    const modeConfig = {
        documents: {
            icon: '📄',
            text: 'Documents Mode - Ask questions about your uploaded files'
        },
        wikipedia: {
            icon: '🌐',
            text: 'Wikipedia Mode - Search general knowledge'
        },
        hybrid: {
            icon: '🔄',
            text: 'Hybrid Mode - AI will choose the best source for your question'
        }
    };
    
    const config = modeConfig[mode];
    selectedModeIcon.textContent = config.icon;
    selectedModeText.textContent = config.text;
    selectedModeDiv.style.display = 'flex';
    
    // Focus on question input
    document.getElementById('questionInput').focus();
}

/**
 * Enable question form
 */
function enableQuestionForm() {
    const questionInput = document.getElementById('questionInput');
    const wordLengthInput = document.getElementById('wordLengthInput');
    const askButton = document.getElementById('askButton');
    const numberControls = document.querySelectorAll('.number-controls button');
    
    questionInput.disabled = false;
    questionInput.placeholder = 'Type your question here...';
    wordLengthInput.disabled = false;
    askButton.disabled = false;
    
    numberControls.forEach(btn => btn.disabled = false);
}

/**
 * Reset QA mode selection
 */
function resetQAMode() {
    selectedQAMode = null;
    document.querySelector('.qa-modes').style.display = 'block';
    document.getElementById('questionForm').style.display = 'none';
    document.getElementById('answerSection').style.display = 'none';
    document.getElementById('selectedMode').style.display = 'none';
}

/**
 * Disable question form
 */
function disableQuestionForm() {
    const questionInput = document.getElementById('questionInput');
    const wordLengthInput = document.getElementById('wordLengthInput');
    const askButton = document.getElementById('askButton');
    const numberControls = document.querySelectorAll('.number-controls button');
    
    questionInput.disabled = true;
    questionInput.placeholder = 'Select a mode above to start asking questions...';
    wordLengthInput.disabled = true;
    askButton.disabled = true;
    
    numberControls.forEach(btn => btn.disabled = true);
}

/**
 * Adjust word length with buttons
 */
function adjustWordLength(delta) {
    const input = document.getElementById('wordLengthInput');
    const currentValue = parseInt(input.value) || 250;
    const newValue = Math.max(50, Math.min(1000, currentValue + delta));
    input.value = newValue;
}

/**
 * Ask question
 */
async function askQuestion() {
    const questionInput = document.getElementById('questionInput');
    const wordLengthInput = document.getElementById('wordLengthInput');
    const askButton = document.getElementById('askButton');
    const askButtonText = document.getElementById('askButtonText');
    const askButtonLoading = document.getElementById('askButtonLoading');
    
    const question = questionInput.value.trim();
    const wordLength = parseInt(wordLengthInput.value) || 250;
    
    if (!question) {
        showToast('Please enter a question', 'error');
        return;
    }
    
    // Show loading state
    askButton.disabled = true;
    askButtonText.style.display = 'none';
    askButtonLoading.style.display = 'inline';
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    try {
        const startTime = Date.now();
        let result;
        
        // Call appropriate API based on mode
        if (selectedQAMode === 'documents') {
            result = await callDocumentsAPI(question, wordLength);
        } else if (selectedQAMode === 'wikipedia') {
            result = await callWikipediaAPI(question, wordLength);
        } else if (selectedQAMode === 'hybrid') {
            // Updated to use the new RAG agent v1 API
            result = await callRagAgentV1API(question, wordLength);
        }
        
        const endTime = Date.now();
        const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
        
        // Display answer
        displayAnswer(result, timeTaken);
        
    } catch (error) {
        console.error('Error asking question:', error);
        showToast('Failed to get answer. Please try again.', 'error');
    } finally {
        // Reset button state
        askButton.disabled = false;
        askButtonText.style.display = 'inline';
        askButtonLoading.style.display = 'none';
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

/**
 * Call Documents API
 */
async function callDocumentsAPI(question, wordLength) {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/chain/ask_documents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: question,
            word_length: wordLength
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to get answer from documents');
    }
    
    return await response.json();
}

/**
 * Call Wikipedia API
 */
async function callWikipediaAPI(question, wordLength) {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/chain/ask_wikipedia', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: question,
            word_length: wordLength
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to get answer from Wikipedia');
    }
    
    return await response.json();
}

/**
 * Call RAG Agent V1 API - Updated to use the new endpoint
 */
async function callRagAgentV1API(question, wordLength) {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/chain/ask_rag_agent', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            question: question,
            word_length: wordLength
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to get hybrid answer from RAG Agent');
    }
    
    return await response.json();
}

/**
 * Display answer with simplified metadata
 */
function displayAnswer(result, timeTaken) {
    currentAnswer = result.answer;
    currentCitations = result.citations || [];
    
    // Show answer section
    document.getElementById('answerSection').style.display = 'block';
    
    // Update answer content with citations
    const answerContent = document.getElementById('answerContent');
    const processedAnswer = processAnswerWithCitations(result.answer, currentCitations);
    answerContent.innerHTML = processedAnswer;
    
    // Update only response time
    document.getElementById('answerTime').textContent = `Response time: ${timeTaken}s`;
    
    // Scroll to answer
    document.getElementById('answerSection').scrollIntoView({ behavior: 'smooth' });
    
    showToast('Answer ready! Click citation numbers for details.', 'success');
}

/**
 * Process answer text to add citation click functionality
 */
function processAnswerWithCitations(answer, citations) {
    if (!citations || citations.length === 0) {
        return `<p>${answer}</p>`;
    }
    
    console.log('Processing citations:', citations.length, 'citations found');
    
    // Create a map of citation references to array indices
    const citationMap = new Map();
    
    // First, map all citations by their source_id if available
    citations.forEach((citation, index) => {
        if (citation.source_id !== undefined) {
            citationMap.set(citation.source_id, index);
        }
    });
    
    // Replace citation patterns like [1], [2], etc. with clickable spans
    // This regex will match any number in square brackets
    let processedAnswer = answer.replace(/\[(\d+)\]/g, (match, num) => {
        const citationRefNum = parseInt(num);
        
        // Find the correct citation index:
        // 1. Try to find by source_id in our map
        // 2. Otherwise use the number as a 1-based index (subtract 1 for 0-based array)
        let citationIndex;
        if (citationMap.has(citationRefNum)) {
            citationIndex = citationMap.get(citationRefNum);
        } else {
            citationIndex = citationRefNum - 1; // Convert 1-based to 0-based index
        }
        
        console.log('Processing citation:', match, 'Reference:', citationRefNum, 'Using index:', citationIndex, 'of', citations.length, 'total citations');
        
        // Ensure citation index is valid
        if (citationIndex >= 0 && citationIndex < citations.length) {
            const citation = citations[citationIndex];
            const sourceText = citation.source || 'Source';
            // Using data attributes instead of inline onclick for better separation
            return `<span class="citation-ref" data-citation-index="${citationIndex}" data-source-id="${citationRefNum}" title="Click to view citation details - ${sourceText}">${match}</span>`;
        } else {
            console.warn('Citation index out of bounds:', citationIndex, 'for', citations.length, 'citations');
            // Still make it clickable but show warning
            return `<span class="citation-ref citation-missing" title="Citation not found">${match}</span>`;
        }
    });
    
    // Debug: Log if any citations were found in the text
    const citationMatches = answer.match(/\[(\d+)\]/g);
    if (citationMatches) {
        console.log('Found citation references in text:', citationMatches);
    } else {
        console.warn('No citation references found in answer text, but citations array has', citations.length, 'items');
    }
    
    return `<p>${processedAnswer}</p>`;
}

/**
 * Toggle citation popup with enhanced UX
 */
function toggleCitationPopup(event, citationIndex) {
    event.stopPropagation();
    
    console.log('Toggle citation popup for index:', citationIndex);
    
    // Safety check for valid citation index
    if (citationIndex < 0 || citationIndex >= currentCitations.length) {
        console.error('Invalid citation index:', citationIndex, 'citations length:', currentCitations.length);
        return;
    }
    
    const tooltip = document.getElementById('citationTooltip');
    const currentlyVisible = tooltip.style.display === 'block';
    const currentCitation = tooltip.getAttribute('data-current-citation');
    
    // If clicking the same citation, toggle it
    if (currentlyVisible && currentCitation == citationIndex) {
        hideCitationTooltip();
        return;
    }
    
    // Show citation details
    showCitationPopup(event, citationIndex);
}

/**
 * Show citation popup with improved content - handles all citation types properly
 */
function showCitationPopup(event, citationIndex) {
    const citation = currentCitations[citationIndex];
    
    console.log('Showing citation popup for index:', citationIndex, 'Citation:', citation);
    
    if (!citation) {
        console.error('Citation not found at index:', citationIndex);
        return;
    }
    
    const tooltip = document.getElementById('citationTooltip');
    const tooltipTitle = document.getElementById('tooltipTitle');
    const tooltipContent = document.getElementById('tooltipContent');
    const tooltipActions = document.getElementById('tooltipActions');
    
    // Extract filename from path for documents
    let displayName = '';
    let isWikipedia = false;
    
    if (citation.source) {
        if (citation.source.startsWith('http')) {
            isWikipedia = true;
            // Extract the article title from Wikipedia URL for display
            const urlParts = citation.source.split('/');
            const articleTitle = urlParts[urlParts.length - 1].replace(/_/g, ' ');
            displayName = decodeURIComponent(articleTitle);
        } else {
            displayName = citation.source.split('\\').pop().split('/').pop();
        }
    } else {
        displayName = 'Unknown Source';
    }
    
    // Use source_id if available for display, otherwise use the array index + 1
    const displayCitationNumber = citation.source_id !== undefined ? citation.source_id : citationIndex + 1;
    tooltipTitle.textContent = `Citation [${displayCitationNumber}]`;
    
    let contentHTML = '';
    
    if (isWikipedia && citation.source) {
        // Show Wikipedia URL prominently for consistency with document citations
        contentHTML += `
            <div class="citation-source">
                <div class="source-icon">🌐</div>
                <div class="source-details">
                    <div class="source-name">Wikipedia Article:</div>
                    <div class="source-url">
                        <a href="${citation.source}" target="_blank" class="wiki-url-link">${displayName}</a>
                    </div>
                </div>
            </div>
        `;
    } else {
        // For documents, show the filename and page
        contentHTML += `
            <div class="citation-source">
                <div class="source-icon">📄</div>
                <div class="source-details">
                    <div class="source-name">${displayName}</div>
                    ${citation.page_label && citation.page_label !== 'N/A' ? `<div class="source-page">Page ${citation.page_label}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Show full content if available - no "See More" needed
    if (citation.page_content) {
        const contentLabel = isWikipedia ? 'Wikipedia Content:' : 'Content from Source:';
        contentHTML += `
            <div class="citation-preview">
                <div class="preview-label">${contentLabel}</div>
                <div class="preview-text">${citation.page_content}</div>
            </div>
        `;
    }
    
    tooltipContent.innerHTML = contentHTML;
    
    // Clear actions since Wikipedia link is now at the top
    tooltipActions.innerHTML = '';
    
    // Show tooltip centered on screen with backdrop
    const backdrop = document.getElementById('citationBackdrop');
    backdrop.style.display = 'block';
    tooltip.style.display = 'block';
    tooltip.setAttribute('data-current-citation', citationIndex);
}

/**
 * Hide citation tooltip
 */
function hideCitationTooltip() {
    const tooltip = document.getElementById('citationTooltip');
    const backdrop = document.getElementById('citationBackdrop');
    tooltip.style.display = 'none';
    backdrop.style.display = 'none';
    tooltip.removeAttribute('data-current-citation');
}

/**
 * Export Q&A as document with enhanced citation details
 */
function exportQA() {
    const question = document.getElementById('questionInput').value;
    const mode = selectedQAMode;
    const timestamp = new Date().toLocaleString();
    
    let exportContent = `Advanced RAG System - Q&A Export\n`;
    exportContent += `Generated on: ${timestamp}\n`;
    exportContent += `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}\n`;
    exportContent += `${'='.repeat(60)}\n\n`;
    exportContent += `QUESTION:\n${question}\n\n`;
    exportContent += `ANSWER:\n${currentAnswer}\n\n`;
    
    if (currentCitations && currentCitations.length > 0) {
        exportContent += `SOURCES & CITATIONS (${currentCitations.length} total):\n`;
        exportContent += `${'='.repeat(40)}\n\n`;
        
        // Create a summary of unique documents used
        const uniqueSources = [...new Set(currentCitations.map(c => c.source).filter(s => s))];
        exportContent += `DOCUMENTS USED:\n`;
        uniqueSources.forEach((source, idx) => {
            const isWikipedia = source.startsWith('http');
            if (isWikipedia) {
                exportContent += `${idx + 1}. Wikipedia Article: ${source}\n`;
            } else {
                const filename = source.split('\\').pop().split('/').pop();
                exportContent += `${idx + 1}. Document: ${filename}\n`;
                exportContent += `   Full Path: ${source}\n`;
            }
        });
        exportContent += `\n`;
        
        exportContent += `DETAILED CITATIONS:\n`;
        currentCitations.forEach((citation, index) => {
            exportContent += `[${index}] `;
            
            if (citation.source) {
                if (citation.source.startsWith('http')) {
                    exportContent += `Source: Wikipedia Article\n`;
                    exportContent += `   URL: ${citation.source}\n`;
                } else {
                    const filename = citation.source.split('\\').pop().split('/').pop();
                    exportContent += `Source: ${filename}\n`;
                    if (citation.page_label) {
                        exportContent += `   Page: ${citation.page_label}\n`;
                    }
                    exportContent += `   File Path: ${citation.source}\n`;
                }
            } else {
                exportContent += 'Source: Unknown\n';
            }
            
            // Add full content
            if (citation.page_content) {
                exportContent += `   Content:\n`;
                exportContent += `   "${citation.page_content}"\n`;
            }
            exportContent += `\n`;
        });
    }
    
    exportContent += `\n${'='.repeat(60)}\n`;
    exportContent += `Export completed at: ${new Date().toLocaleString()}\n`;
    exportContent += `Advanced RAG System - Document Analysis & Q&A\n`;
    
    // Create and download file
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Better filename with mode and timestamp
    const dateStr = new Date().toISOString().slice(0,16).replace(/[:-]/g, '');
    const modeStr = mode.charAt(0).toUpperCase() + mode.slice(1);
    const questionPreview = question.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `QA_${modeStr}_${questionPreview}_${dateStr}.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Q&A exported with full citation details!', 'success');
}

/**
 * Go to file management
 */
function goToFileManagement() {
    window.location.href = '/file-management';
}

/**
 * Go back to dashboard
 */
function goBackToDashboard() {
    window.location.href = '/dashboard';
}

/**
 * Handle logout
 */
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('username');
    window.location.href = '/login';
}

/**
 * Show toast message
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
        max-width: 300px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

/**
 * Set up citation handlers
 */
function setupCitationHandlers() {
    // Add event listener for close button
    const closeTooltipBtn = document.getElementById('closeTooltipBtn');
    if (closeTooltipBtn) {
        closeTooltipBtn.addEventListener('click', hideCitationTooltip);
    }
    
    // Close tooltip when clicking outside
    document.addEventListener('click', function(event) {
        const tooltip = document.getElementById('citationTooltip');
        if (tooltip.style.display === 'block' && 
            !tooltip.contains(event.target) && 
            !event.target.classList.contains('citation-ref')) {
            hideCitationTooltip();
        }
    });
    
    // Add citation click handler using event delegation
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('citation-ref')) {
            event.preventDefault();
            event.stopPropagation();
            
            const citationIndex = parseInt(event.target.getAttribute('data-citation-index'));
            if (!isNaN(citationIndex)) {
                toggleCitationPopup(event, citationIndex);
            }
        }
    });
    
    // Add escape key handler
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + Enter to submit query
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            if (selectedQAMode && document.getElementById('questionInput').value.trim() && !document.getElementById('askButton').disabled) {
                askQuestion();
            }
        }
        
        // Escape to close tooltip
        if (event.key === 'Escape') {
            hideCitationTooltip();
            const modal = document.querySelector('.content-modal');
            if (modal) modal.remove();
        }
    });
}
