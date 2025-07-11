/**
 * File Management JavaScript
 * Handles file management functionality for Advanced RAG System
 */

// Global variables
let allFiles = [];
let selectedFileIds = [];
let currentFileId = null;
let confirmCallback = null;
let statusCheckInterval = null;
let currentPage = 1;
let itemsPerPage = 5; // Show 5 files per page

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Set username
    const username = localStorage.getItem('username') || 'User';
    document.getElementById('username').textContent = username;

    // Load files and check RAG status
    loadFiles();
    checkRAGStatus();

    // Set up file input handler
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileUpload);

    // Set up drag and drop
    setupDragAndDrop();

    // Set up search
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

/**
 * Toast notification system
 */
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add toast styles if not present
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.innerHTML = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 300px;
                padding: 16px;
                border-radius: 8px;
                color: white;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .toast-success { background: linear-gradient(135deg, #28a745, #20c997); }
            .toast-error { background: linear-gradient(135deg, #dc3545, #e74c3c); }
            .toast-warning { background: linear-gradient(135deg, #ffc107, #f39c12); color: #333; }
            .toast-info { background: linear-gradient(135deg, #17a2b8, #3498db); }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .toast-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return 'ℹ️';
    }
}

/**
 * Loading and navigation helpers
 */
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function navigateWithLoading(url) {
    showLoading();
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

/**
 * Authentication helpers
 */
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('tokenType');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    return {
        'Authorization': `${tokenType} ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * File management functions
 */
async function loadFiles() {
    try {
        showLoading();
        const response = await fetch('/api/files/list_all_uploaded_files', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allFiles = data.files || [];
        
        // Update selected file IDs
        selectedFileIds = allFiles
            .filter(file => file.is_selected)
            .map(file => file.id);
            
        renderFiles(allFiles);
        updateStats();
        
    } catch (error) {
        console.error('Error loading files:', error);
        showToast('Failed to load files', 'error');
    } finally {
        hideLoading();
    }
}

function renderFiles(files) {
    const container = document.getElementById('filesList');
    
    if (files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h3>No documents uploaded yet</h3>
                <p>Upload your first PDF document to get started</p>
                <button class="btn-primary" onclick="openUploadModal()">
                    📤 Upload Document
                </button>
            </div>
        `;
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(files.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, files.length);
    const currentFiles = files.slice(startIndex, endIndex);
    
    // Build the file list HTML
    let filesHTML = `
        <div class="files-tabs">
            ${currentFiles.map(file => `
                <div class="file-tab ${file.is_selected ? 'selected' : ''}" data-file-id="${file.id}">
                    <div class="file-select">
                        <input type="checkbox" 
                               ${file.is_selected ? 'checked' : ''} 
                               onchange="toggleFileSelection(${file.id})"
                               class="file-checkbox">
                    </div>
                    <div class="file-info">
                        <div class="file-name">📄 ${file.filename}</div>
                        <div class="file-meta">
                            <span class="file-date">📅 ${formatDate(file.upload_date)}</span>
                            <span class="file-status">${file.is_selected ? '✅ Selected' : '⚪ Not Selected'}</span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="action-btn view" onclick="showFileDetails(${file.id})" title="View Description">
                            📝
                        </button>
                        <button class="action-btn delete" onclick="deleteFileFromList(${file.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add pagination controls if there's more than one page
    if (totalPages > 1) {
        filesHTML += `
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    ← Previous
                </button>
                <div class="page-indicator">Page ${currentPage} of ${totalPages}</div>
                <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Next →
                </button>
            </div>
        `;
    }
    
    container.innerHTML = filesHTML;
}

function updateStats() {
    const totalFiles = allFiles.length;
    const selectedFiles = allFiles.filter(f => f.is_selected).length;

    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('selectedFiles').textContent = selectedFiles;

    // Update initialize button state - enable only when files are selected
    const initializeBtn = document.getElementById('initializeBtn');
    initializeBtn.disabled = selectedFiles === 0;
}

async function toggleFileSelection(fileId) {
    try {
        const file = allFiles.find(f => f.id === fileId);
        if (!file) return;

        // Check selection limit
        const currentSelected = allFiles.filter(f => f.is_selected).length;
        if (!file.is_selected && currentSelected >= 3) {
            showToast('You can select maximum 3 files', 'warning');
            // Reset the checkbox
            document.querySelector(`.file-tab[data-file-id="${fileId}"] .file-checkbox`).checked = false;
            return;
        }

        let newSelected;
        if (file.is_selected) {
            // Deselect
            newSelected = selectedFileIds.filter(id => id !== fileId);
        } else {
            // Select
            newSelected = [...selectedFileIds, fileId];
        }

        const response = await fetch('/api/files/select_files', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newSelected)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Update selected files from response
        selectedFileIds = data.selected_files.map(file => file.id);
        
        // Update UI to reflect changes
        allFiles = allFiles.map(f => {
            if (selectedFileIds.includes(f.id)) {
                return { ...f, is_selected: true };
            } else {
                return { ...f, is_selected: false };
            }
        });
        
        renderFiles(allFiles);
        updateStats();
        
        showToast(`File ${selectedFileIds.includes(fileId) ? 'selected' : 'unselected'}`, 'success');
        
    } catch (error) {
        console.error('Error toggling file selection:', error);
        showToast('Failed to update file selection', 'error');
        loadFiles(); // Reload to ensure UI is in sync with server
    }
}

async function initializeResources() {
    try {
        const initializeBtn = document.getElementById('initializeBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        // Clear any existing status check interval
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
        
        // Update UI to show initialization starting
        initializeBtn.disabled = true;
        initializeBtn.innerHTML = '⏳ Starting...';
        statusIndicator.className = 'status-indicator loading';
        statusText.textContent = 'RAG Status: Starting initialization...';
        
        showToast('Starting RAG initialization in background...', 'info');
        
        const response = await fetch('/api/chain/initialize', {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Start polling for status updates
        initializeBtn.innerHTML = '⏳ Initializing...';
        statusText.textContent = 'RAG Status: Initializing...';
        showToast('RAG initialization started. This may take a few minutes...', 'info');
        
        // Poll status every 30 seconds
        statusCheckInterval = setInterval(async () => {
            try {
                const statusResponse = await fetch('/api/chain/status', {
                    headers: getAuthHeaders()
                });
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    
                    if (statusData.status === 'ready') {
                        // Success
                        clearInterval(statusCheckInterval);
                        initializeBtn.innerHTML = '✅ Initialized';
                        statusIndicator.className = 'status-indicator success';
                        statusText.textContent = 'Document Status: Ready';
                        showToast('Documents processed successfully!', 'success');
                        
                        setTimeout(() => {
                            initializeBtn.innerHTML = '🚀 Prepare Documents for Smart Search';
                            initializeBtn.disabled = false;
                        }, 3000);
                        
                    } else if (statusData.status === 'error') {
                        // Error
                        clearInterval(statusCheckInterval);
                        initializeBtn.innerHTML = '❌ Failed';
                        initializeBtn.disabled = false;
                        statusIndicator.className = 'status-indicator error';
                        statusText.textContent = 'Document Status: Error';
                        showToast(`Document processing failed: ${statusData.message}`, 'error');
                        
                        setTimeout(() => {
                            initializeBtn.innerHTML = '🚀 Prepare Documents for Smart Search';
                        }, 3000);
                    }
                    // If status is still 'initializing', continue polling
                }
            } catch (error) {
                console.error('Error checking status:', error);
            }
        }, 30000); // Check every 30 seconds
        
        // Stop polling after 10 minutes (timeout)
        setTimeout(() => {
            clearInterval(statusCheckInterval);
            if (statusIndicator.className.includes('loading')) {
                initializeBtn.innerHTML = '⏰ Timeout';
                statusText.textContent = 'Document Status: Timeout';
                showToast('Document processing timeout. Please try again.', 'warning');
                setTimeout(() => {
                    initializeBtn.innerHTML = '🚀 Prepare Documents for Smart Search';
                    initializeBtn.disabled = false;
                }, 3000);
            }
        }, 600000); // 10 minutes
        
    } catch (error) {
        console.error('Error initializing resources:', error);
        
        // Update UI to show error
        const initializeBtn = document.getElementById('initializeBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        initializeBtn.innerHTML = '❌ Failed';
        initializeBtn.disabled = false;
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'Document Status: Error';
        
        showToast('Failed to start document processing', 'error');
        
        setTimeout(() => {
            initializeBtn.innerHTML = '🚀 Prepare Documents for Smart Search';
        }, 3000);
    }
}

/**
 * Upload functionality
 */
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    resetUploadForm();
}

function resetUploadForm() {
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreviewContainer').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = 'Uploading...';
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('fileInput').files = files;
            handleFileUpload({ target: { files } });
        }
    });
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check for duplicates by comparing names with existing files
    const existingFilenames = allFiles.map(file => file.filename);
    const duplicates = [];
    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file type
        if (file.type !== 'application/pdf') {
            showToast('Only PDF files are allowed', 'error');
            resetUploadForm();
            return;
        }
        
        // Check for duplicates
        if (existingFilenames.includes(file.name)) {
            duplicates.push(file.name);
        } else {
            validFiles.push(file);
        }
    }
    
    // Show warning if duplicates found
    if (duplicates.length > 0) {
        showToast(`Duplicate file(s) found: ${duplicates.join(', ')}`, 'warning');
        
        // If there are no valid files left, reset form
        if (validFiles.length === 0) {
            resetUploadForm();
            return;
        }
    }
    
    // If valid files remain, create a new FileList with only valid files
    if (validFiles.length > 0) {
        const dt = new DataTransfer();
        validFiles.forEach(file => dt.items.add(file));
        document.getElementById('fileInput').files = dt.files;
        
        // Show preview of selected files
        showFilePreview(dt.files);
    }
}

function showFilePreview(files) {
    const previewContainer = document.getElementById('filePreviewContainer');
    const previewList = document.getElementById('filePreviewList');
    
    previewList.innerHTML = Array.from(files).map((file, index) => `
        <div class="preview-file-item" data-index="${index}">
            <div class="preview-file-info">
                <div class="preview-file-icon">📄</div>
                <div class="preview-file-details">
                    <div class="preview-file-name">${file.name}</div>
                    <div class="preview-file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="preview-remove-btn" onclick="removePreviewFile(${index})" title="Remove">
                ×
            </button>
        </div>
    `).join('');
    
    previewContainer.style.display = 'block';
}

function removePreviewFile(index) {
    const fileInput = document.getElementById('fileInput');
    const dt = new DataTransfer();
    
    // Re-add all files except the one to remove
    Array.from(fileInput.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    
    fileInput.files = dt.files;
    
    if (fileInput.files.length === 0) {
        clearFileSelection();
    } else {
        showFilePreview(fileInput.files);
    }
}

function clearFileSelection() {
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreviewContainer').style.display = 'none';
}

async function uploadSelectedFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (!files || files.length === 0) {
        showToast('No files selected', 'error');
        return;
    }

    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }

    try {
        // Show progress
        document.getElementById('uploadProgress').style.display = 'block';
        
        const response = await fetch('/api/files/upload_files', {
            method: 'POST',
            headers: {
                'Authorization': `${localStorage.getItem('tokenType') || 'Bearer'} ${localStorage.getItem('authToken')}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 400 && data.detail && data.detail.includes('already exists')) {
                throw new Error(`File already exists: ${data.detail}`);
            } else {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }
        }

        // Complete progress
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').style.display = 'none';
        
        showToast(`${files.length} file(s) uploaded successfully!`, 'success');
        
        // Close modal and refresh
        setTimeout(() => {
            closeUploadModal();
            loadFiles();
        }, 1500);
        
    } catch (error) {
        console.error('Error uploading files:', error);
        showToast(`Upload failed: ${error.message}`, 'error');
        
        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = 'Upload failed';
        
        // Don't close modal to let user try again
    }
}

/**
 * File details modal
 */
function showFileDetails(fileId) {
    const file = allFiles.find(f => f.id === fileId);
    if (!file) return;

    currentFileId = fileId;
    
    document.getElementById('fileDetailsTitle').textContent = `📄 ${file.filename}`;
    document.getElementById('fileDetailsContent').innerHTML = `
        <div class="file-details">
            <div class="detail-row">
                <strong>🤖 AI Generated Description:</strong>
                <div class="detail-value description-content">
                    ${file.description || 'No description available. The AI summary is being generated in the background.'}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('fileDetailsModal').style.display = 'flex';
}

function closeFileDetailsModal() {
    document.getElementById('fileDetailsModal').style.display = 'none';
    currentFileId = null;
}

function deleteFileFromList(fileId) {
    const file = allFiles.find(f => f.id === fileId);
    showConfirmModal(
        'Delete File',
        `Are you sure you want to delete "${file.filename}"? This action cannot be undone.`,
        async () => {
            try {
                const response = await fetch(`/api/files/${fileId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                showToast('File deleted successfully', 'success');
                loadFiles(); // Reload the file list
                
            } catch (error) {
                console.error('Error deleting file:', error);
                showToast('Failed to delete file', 'error');
            }
        }
    );
}

/**
 * Confirmation modal
 */
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}

function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
        closeConfirmModal();
    }
}

/**
 * Search functionality
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredFiles = allFiles.filter(file => 
        file.filename.toLowerCase().includes(searchTerm) ||
        (file.description && file.description.toLowerCase().includes(searchTerm))
    );
    renderFiles(filteredFiles);
}

/**
 * Pagination control
 */
function changePage(newPage) {
    const totalPages = Math.ceil(allFiles.length / itemsPerPage);
    
    // Validate page number
    if (newPage < 1 || newPage > totalPages) {
        return;
    }
    
    currentPage = newPage;
    renderFiles(allFiles.filter(file => 
        document.getElementById('searchInput').value === '' || 
        file.filename.toLowerCase().includes(document.getElementById('searchInput').value.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(document.getElementById('searchInput').value.toLowerCase()))
    ));
}

/**
 * Utility functions
 */
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Function to check document processing status
async function checkRAGStatus() {
    try {
        const response = await fetch('/api/chain/status', {
            headers: getAuthHeaders()
        });

        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        if (response.ok) {
            const data = await response.json();
            if (data.initialized) {
                statusIndicator.className = 'status-indicator success';
                statusText.textContent = 'Document Status: Ready';
            } else {
                statusIndicator.className = 'status-indicator warning';
                statusText.textContent = 'Document Status: Not Processed';
            }
        } else {
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'Document Status: Unknown';
        }
    } catch (error) {
        console.error('Error checking document status:', error);
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'Document Status: Error';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (modal.id === 'uploadModal') {
                resetUploadForm();
            }
            if (modal.id === 'fileDetailsModal') {
                currentFileId = null;
            }
            if (modal.id === 'confirmModal') {
                confirmCallback = null;
            }
        }
    });
});
