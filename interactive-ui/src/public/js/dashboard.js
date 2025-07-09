/**
 * Dashboard JavaScript
 * Handles dashboard functionality for the Advanced RAG System
 */

// Simple utility functions
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
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function showLoading() {
    let overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    let overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function navigateWithLoading(url) {
    showLoading();
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Navigation functions
function navigateToFileManagement() {
    navigateWithLoading('/file-management');
}

function navigateToQueryInterface() {
    navigateWithLoading('/query-interface');
}

function navigateToChatInterface() {
    navigateWithLoading('/chat-interface');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('username');
        showToast('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/login?message=logout';
        }, 1000);
    }
}

// Initialize dashboard data
function initDashboard() {
    // Load user data
    const username = localStorage.getItem('username') || 'User';
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = username;
    }

    // Get file information from the existing files API
    const token = localStorage.getItem('authToken');
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    
    if (token) {
        fetch('/api/files/list_all_uploaded_files', {
            headers: {
                'Authorization': `${tokenType} ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const fileCountElement = document.getElementById('fileCount');
            if (fileCountElement && data.files) {
                fileCountElement.textContent = data.files.length || 0;
            }
        })
        .catch(error => {
            console.log('File loading failed, using defaults');
        });
    }
}

// Run initialization on page load
document.addEventListener('DOMContentLoaded', initDashboard);
