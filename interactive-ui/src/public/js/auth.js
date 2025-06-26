/*
   Advanced RAG Authentication System - Interactive JavaScript
   Handles form interactions, animations, and API calls
*/

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initializeFormValidation();
    initializeLoadingStates();
    initializeInteractiveElements();
    initializeFormSubmissions();
});

/**
 * Initialize form validation with real-time feedback
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            // Add real-time validation
            input.addEventListener('input', function() {
                validateField(this);
            });
            
            // Add blur validation
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
}

/**
 * Validate individual form fields
 * @param {HTMLElement} field - The input field to validate
 */
function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const name = field.name;
    
    // Remove existing validation classes
    field.classList.remove('valid', 'invalid');
    
    // Validation rules
    let isValid = true;
    let errorMessage = '';
    
    switch (name) {
        case 'username':
            isValid = value.length >= 3;
            errorMessage = 'Username must be at least 3 characters long';
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(value);
            errorMessage = 'Please enter a valid email address';
            break;
            
        case 'password':
            isValid = value.length >= 6;
            errorMessage = 'Password must be at least 6 characters long';
            break;
            
        case 'new_password':
            isValid = value.length >= 6;
            errorMessage = 'New password must be at least 6 characters long';
            break;
    }
    
    // Apply validation styling
    if (value.length > 0) {
        if (isValid) {
            field.classList.add('valid');
            removeFieldError(field);
        } else {
            field.classList.add('invalid');
            showFieldError(field, errorMessage);
        }
    } else {
        removeFieldError(field);
    }
    
    return isValid;
}

/**
 * Show field-specific error message
 * @param {HTMLElement} field - The input field
 * @param {string} message - Error message to display
 */
function showFieldError(field, message) {
    // Remove existing error message
    removeFieldError(field);
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: var(--danger-color);
        font-size: 12px;
        margin-top: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Insert after the field
    field.parentNode.appendChild(errorElement);
    
    // Animate in
    setTimeout(() => {
        errorElement.style.opacity = '1';
    }, 10);
}

/**
 * Remove field error message
 * @param {HTMLElement} field - The input field
 */
function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Initialize loading states for buttons
 */
function initializeLoadingStates() {
    const buttons = document.querySelectorAll('.btn-primary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('loading')) {
                e.preventDefault();
                return;
            }
            
            // Add loading state
            this.classList.add('loading');
            this.setAttribute('data-original-text', this.textContent);
            this.textContent = 'Processing...';
            
            // Remove loading state after form submission attempt
            setTimeout(() => {
                this.classList.remove('loading');
                this.textContent = this.getAttribute('data-original-text');
            }, 2000);
        });
    });
}

/**
 * Initialize interactive elements and animations
 */
function initializeInteractiveElements() {
    // Add hover effects to cards
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        authCard.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    // Add click animations to links
    const links = document.querySelectorAll('.auth-links a');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // Add ripple effect
            createRippleEffect(this, e);
        });
    });
    
    // Initialize floating labels if present
    initializeFloatingLabels();
}

/**
 * Create ripple effect on click
 * @param {HTMLElement} element - The clicked element
 * @param {Event} event - Click event
 */
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Initialize floating label functionality
 */
function initializeFloatingLabels() {
    const floatingLabels = document.querySelectorAll('.floating-label');
    
    floatingLabels.forEach(container => {
        const input = container.querySelector('input');
        const label = container.querySelector('label');
        
        if (input && label) {
            // Check initial state
            if (input.value.trim() !== '') {
                label.classList.add('floating');
            }
            
            input.addEventListener('focus', () => {
                label.classList.add('floating');
            });
            
            input.addEventListener('blur', () => {
                if (input.value.trim() === '') {
                    label.classList.remove('floating');
                }
            });
        }
    });
}

/**
 * Initialize form submissions with API integration
 */
function initializeFormSubmissions() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // Forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmit);
    }
}

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    // Validate form
    if (!validateForm(event.target)) {
        showToast('Please fill in all fields correctly', 'error');
        return;
    }
    
    try {
        showToast('Signing you in...', 'info');
        console.log('🔄 Making login API call with username:', username);
        
        // Create FormData for OAuth2PasswordRequestForm
        const loginData = new FormData();
        loginData.append('username', username);
        loginData.append('password', password);
        
        const response = await fetch('/api/auth/token', {
            method: 'POST',
            body: loginData // Send as FormData, not JSON
        });
        
        console.log('📡 Login API response status:', response.status);
        const result = await response.json();
        console.log('📡 Login API response data:', result);
        
        if (response.ok) {
            showToast('Login successful! Redirecting...', 'success');
            
            // Store authentication data
            localStorage.setItem('authToken', result.access_token);
            localStorage.setItem('tokenType', result.token_type);
            localStorage.setItem('username', username);
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showToast(result.detail || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showToast('Network error. Please check your connection and ensure the backend server is running.', 'error');
    }
}

/**
 * Handle register form submission
 * @param {Event} event - Form submit event
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    // Validate form
    if (!validateForm(event.target)) {
        showToast('Please fill in all fields correctly', 'error');
        return;
    }
    
    try {
        showToast('Creating your account...', 'info');
        
        const response = await fetch('/api/auth/create_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Account created successfully! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showToast(result.detail || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error. Please check your connection.', 'error');
    }
}

/**
 * Handle forgot password form submission
 * @param {Event} event - Form submit event
 */
async function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        username: formData.get('username'),
        new_password: formData.get('new_password')
    };
    
    // Validate form
    if (!validateForm(event.target)) {
        showToast('Please fill in all fields correctly', 'error');
        return;
    }
    
    try {
        showToast('Updating your password...', 'info');
        
        const response = await fetch('/api/auth/reset_password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Password updated successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            showToast(result.detail || 'Password update failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Password update error:', error);
        showToast('Network error. Please check your connection.', 'error');
    }
}

/**
 * Validate entire form
 * @param {HTMLElement} form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Enhanced message display function for better UX
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info, warning)
 */
function showMessage(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    showToast(message, type);
    
    // Also add a temporary message to the form if toast fails
    const activeForm = document.querySelector('form');
    if (activeForm) {
        let messageElement = activeForm.querySelector('.temp-message');
        if (messageElement) {
            messageElement.remove();
        }
        
        messageElement = document.createElement('div');
        messageElement.className = `message temp-message ${type}`;
        messageElement.textContent = message;
        activeForm.insertBefore(messageElement, activeForm.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
}

/**
 * Utility function to add CSS animations dynamically
 */
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            from {
                transform: scale(0);
                opacity: 1;
            }
            to {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        .field-error {
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(-10px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        /* Mobile responsive for auth forms */
        @media (max-width: 768px) {
            .auth-card {
                margin: 10px;
                padding: 20px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize custom styles
addCustomStyles();

// Add some fun console messages for developers
console.log(`
🤖 Advanced RAG Authentication System
🔒 Secure • Modern • Interactive
🚀 Ready for API integration!
`);

// Add global error handler for debugging
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
});

// Add global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});
