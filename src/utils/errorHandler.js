/**
 * Comprehensive Error Handling Utilities
 * Provides centralized error handling, recovery, and user feedback
 */

class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.errorCounts = new Map();
    this.userNotificationQueue = [];
    this.recoveryStrategies = new Map();
    this.setupRecoveryStrategies();
  }
  
  setupRecoveryStrategies() {
    // File upload errors
    this.recoveryStrategies.set('FILE_UPLOAD_ERROR', {
      retry: true,
      maxRetries: 3,
      backoff: [1000, 2000, 5000],
      fallback: () => this.showFileUploadFallback(),
      userMessage: 'File upload failed. Please try again or use copy/paste instead.'
    });
    
    // PDF processing errors
    this.recoveryStrategies.set('PDF_PROCESSING_ERROR', {
      retry: false,
      fallback: () => this.suggestManualExtraction(),
      userMessage: 'Unable to extract text from PDF. Please copy and paste the content manually.'
    });
    
    // Session load errors
    this.recoveryStrategies.set('SESSION_LOAD_ERROR', {
      retry: true,
      maxRetries: 2,
      fallback: () => this.createEmptySession(),
      userMessage: 'Session could not be loaded. Starting with a clean form.'
    });
    
    // Prompt generation errors
    this.recoveryStrategies.set('PROMPT_GENERATION_ERROR', {
      retry: true,
      maxRetries: 2,
      fallback: () => this.showBasicPrompt(),
      userMessage: 'Prompt generation encountered an issue. Please check your inputs and try again.'
    });
    
    // Memory errors
    this.recoveryStrategies.set('MEMORY_ERROR', {
      retry: false,
      fallback: () => this.freeMemory(),
      userMessage: 'Running low on memory. Some features may be limited.'
    });
    
    // Network errors (for future API integration)
    this.recoveryStrategies.set('NETWORK_ERROR', {
      retry: true,
      maxRetries: 3,
      backoff: [2000, 5000, 10000],
      fallback: () => this.enableOfflineMode(),
      userMessage: 'Network connectivity issues detected. Operating in offline mode.'
    });
  }
  
  // Main error handling method
  async handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error, context);
    const errorId = this.generateErrorId();
    
    // Log the error
    this.logger.error('Error occurred', {
      errorId,
      ...errorInfo,
      context
    });
    
    // Update error statistics
    this.updateErrorStats(errorInfo.type);
    
    // Check for critical errors
    if (this.isCriticalError(errorInfo)) {
      this.logger.critical('Critical error detected', { errorId, ...errorInfo });
      return this.handleCriticalError(errorInfo, errorId);
    }
    
    // Attempt recovery
    const recovered = await this.attemptRecovery(errorInfo, errorId);
    
    if (!recovered) {
      this.showUserNotification(errorInfo, errorId);
    }
    
    return { errorId, recovered, errorInfo };
  }
  
  analyzeError(error, context) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };
    
    // Determine error type and severity
    errorInfo.type = this.categorizeError(error, context);
    errorInfo.severity = this.assessSeverity(error, context);
    
    // Add browser and environment info
    errorInfo.browserInfo = {
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null,
      storage: this.getStorageInfo()
    };
    
    return errorInfo;
  }
  
  categorizeError(error, context) {
    if (context.operation) {
      switch (context.operation) {
        case 'fileUpload': return 'FILE_UPLOAD_ERROR';
        case 'pdfProcessing': return 'PDF_PROCESSING_ERROR';
        case 'sessionLoad': return 'SESSION_LOAD_ERROR';
        case 'promptGeneration': return 'PROMPT_GENERATION_ERROR';
        default: return 'UNKNOWN_ERROR';
      }
    }
    
    // Analyze error message and stack
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('out of memory') || message.includes('memory')) {
      return 'MEMORY_ERROR';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('pdf') || context.fileName?.endsWith('.pdf')) {
      return 'PDF_PROCESSING_ERROR';
    }
    
    if (message.includes('file') || context.fileName) {
      return 'FILE_UPLOAD_ERROR';
    }
    
    if (stack.includes('localstorage') || stack.includes('session')) {
      return 'SESSION_LOAD_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  assessSeverity(error, context) {
    // Critical: Application cannot continue
    if (error.name === 'SecurityError' || 
        error.message?.includes('Critical') ||
        context.critical) {
      return 'critical';
    }
    
    // High: Major functionality broken
    if (error.name === 'TypeError' && error.stack?.includes('Cannot read') ||
        context.operation === 'promptGeneration') {
      return 'high';
    }
    
    // Medium: Feature degraded but application usable
    if (context.operation === 'fileUpload' || 
        context.operation === 'sessionLoad') {
      return 'medium';
    }
    
    // Low: Minor issue or expected error
    return 'low';
  }
  
  isCriticalError(errorInfo) {
    return errorInfo.severity === 'critical' ||
           this.errorCounts.get(errorInfo.type) > 10 ||
           (performance.memory && 
            performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.9);
  }
  
  async attemptRecovery(errorInfo, errorId) {
    const strategy = this.recoveryStrategies.get(errorInfo.type);
    if (!strategy) {
      this.logger.warn('No recovery strategy found', { 
        errorType: errorInfo.type, 
        errorId 
      });
      return false;
    }
    
    this.logger.info('Attempting error recovery', { 
      errorType: errorInfo.type, 
      strategy: strategy.retry ? 'retry' : 'fallback',
      errorId 
    });
    
    // Try retry with backoff if configured
    if (strategy.retry && strategy.maxRetries) {
      const retryCount = this.errorCounts.get(errorInfo.type) || 0;
      
      if (retryCount < strategy.maxRetries) {
        const delay = strategy.backoff ? strategy.backoff[Math.min(retryCount, strategy.backoff.length - 1)] : 1000;
        
        this.logger.info('Retrying operation', { 
          errorType: errorInfo.type, 
          retryCount: retryCount + 1,
          delay,
          errorId 
        });
        
        await this.delay(delay);
        return true; // Let the caller retry
      }
    }
    
    // Execute fallback strategy
    if (strategy.fallback) {
      try {
        await strategy.fallback();
        this.logger.info('Fallback strategy executed', { 
          errorType: errorInfo.type, 
          errorId 
        });
        return true;
      } catch (fallbackError) {
        this.logger.error('Fallback strategy failed', { 
          errorType: errorInfo.type, 
          fallbackError: fallbackError.message,
          errorId 
        });
      }
    }
    
    return false;
  }
  
  async handleCriticalError(errorInfo, errorId) {
    // Save current state before potential crash
    this.saveEmergencyState();
    
    // Clear memory if possible
    if (errorInfo.type === 'MEMORY_ERROR') {
      this.freeMemory();
    }
    
    // Show critical error message
    this.showCriticalErrorMessage(errorInfo, errorId);
    
    // Send error report (if reporting is enabled)
    this.reportCriticalError(errorInfo, errorId);
    
    return { critical: true, errorId, recovered: false };
  }
  
  // Recovery strategy implementations
  showFileUploadFallback() {
    const uploadTab = document.querySelector('.template-tab[data-tab="upload"]');
    const pasteTab = document.querySelector('.template-tab[data-tab="paste"]');
    
    if (pasteTab && uploadTab) {
      pasteTab.click();
      this.highlightElement(document.getElementById('templateText'));
    }
  }
  
  suggestManualExtraction() {
    const statusElement = document.getElementById('uploadStatus');
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="error-recovery">
          <p>Unable to extract text from PDF automatically.</p>
          <p><strong>Suggestion:</strong> Open the PDF and copy/paste the content into the text area.</p>
        </div>
      `;
    }
  }
  
  createEmptySession() {
    // Reset to default state
    if (window.appState) {
      const defaultState = {
        platform: 'claude',
        position: 'applicant',
        chronology: '',
        arguments: '',
        templateText: '',
        instructions: '',
        opposingSubmissions: '',
        plaintiffPleadings: '',
        defendantPleadings: '',
        summonsApplication: '',
        includeChecklist: true
      };
      
      Object.assign(window.appState, defaultState);
      
      // Update UI
      if (window.loadSessionData) {
        window.loadSessionData(defaultState);
      }
    }
  }
  
  showBasicPrompt() {
    const outputSection = document.getElementById('outputSection');
    if (outputSection) {
      outputSection.style.display = 'block';
      
      const claudeOutput = document.getElementById('claudePromptOutput');
      if (claudeOutput) {
        claudeOutput.textContent = 'Basic prompt generation failed. Please check your inputs and try again.';
      }
    }
  }
  
  freeMemory() {
    // Clear large data structures
    if (window.logger) {
      window.logger.clearLogs();
    }
    
    // Clear image caches if any
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    this.logger.info('Memory cleanup performed');
  }
  
  enableOfflineMode() {
    // Hide any online-only features
    const onlineElements = document.querySelectorAll('[data-requires-online]');
    onlineElements.forEach(el => el.style.display = 'none');
    
    // Show offline indicator
    this.showOfflineIndicator();
  }
  
  saveEmergencyState() {
    try {
      const emergencyState = {
        timestamp: Date.now(),
        url: window.location.href,
        appState: window.appState || {},
        formData: this.extractFormData(),
        errorId: this.generateErrorId()
      };
      
      localStorage.setItem('emergency-state', JSON.stringify(emergencyState));
      this.logger.info('Emergency state saved');
    } catch (e) {
      this.logger.error('Failed to save emergency state', { error: e.message });
    }
  }
  
  extractFormData() {
    const formData = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      if (input.id) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          formData[input.id] = input.checked;
        } else {
          formData[input.id] = input.value;
        }
      }
    });
    
    return formData;
  }
  
  // User notification methods
  showUserNotification(errorInfo, errorId) {
    const strategy = this.recoveryStrategies.get(errorInfo.type);
    const message = strategy?.userMessage || 'An unexpected error occurred. Please try again.';
    
    this.createNotificationElement(message, errorInfo.severity, errorId);
  }
  
  showCriticalErrorMessage(errorInfo, errorId) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
      text-align: center;
    `;
    
    modal.innerHTML = `
      <h3 style="color: #d32f2f; margin-bottom: 1rem;">Critical Error</h3>
      <p>A critical error has occurred and the application may need to restart.</p>
      <p style="font-size: 0.9em; color: #666; margin: 1rem 0;">
        Error ID: ${errorId}
      </p>
      <button onclick="window.location.reload()" style="
        background: #d32f2f;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
      ">Restart Application</button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
  createNotificationElement(message, severity, errorId) {
    const notification = document.createElement('div');
    notification.className = `error-notification severity-${severity}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getSeverityColor(severity)};
      color: white;
      padding: 1rem;
      border-radius: 4px;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-weight: bold; margin-bottom: 0.5rem;">
            ${this.getSeverityLabel(severity)}
          </div>
          <div style="font-size: 0.9em;">${message}</div>
          <div style="font-size: 0.8em; opacity: 0.8; margin-top: 0.5rem;">
            ID: ${errorId.substring(0, 8)}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.2em;
          padding: 0;
          margin-left: 1rem;
        ">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, this.getSeverityTimeout(severity));
  }
  
  showOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #ff9800;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      z-index: 1000;
      font-size: 0.9em;
    `;
    indicator.textContent = 'Offline Mode';
    
    document.body.appendChild(indicator);
  }
  
  // Utility methods
  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }
  
  updateErrorStats(errorType) {
    const count = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, count + 1);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  highlightElement(element) {
    if (!element) return;
    
    element.style.border = '2px solid #2196F3';
    element.focus();
    
    setTimeout(() => {
      element.style.border = '';
    }, 3000);
  }
  
  getSeverityColor(severity) {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#d32f2f'
    };
    return colors[severity] || colors.medium;
  }
  
  getSeverityLabel(severity) {
    const labels = {
      low: 'Notice',
      medium: 'Warning',
      high: 'Error',
      critical: 'Critical Error'
    };
    return labels[severity] || 'Error';
  }
  
  getSeverityTimeout(severity) {
    const timeouts = {
      low: 3000,
      medium: 5000,
      high: 8000,
      critical: 0 // No auto-dismiss
    };
    return timeouts[severity] || 5000;
  }
  
  getStorageInfo() {
    try {
      const quota = navigator.storage?.estimate?.();
      return {
        localStorage: {
          used: JSON.stringify(localStorage).length,
          available: true
        },
        quota: quota || null
      };
    } catch (e) {
      return { error: e.message };
    }
  }
  
  reportCriticalError(errorInfo, errorId) {
    // This would send error reports to a logging service
    // For now, just log locally
    this.logger.critical('Critical error report', {
      errorId,
      errorInfo,
      timestamp: Date.now()
    });
  }
  
  // Public API
  getErrorStats() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    };
  }
  
  clearErrorStats() {
    this.errorCounts.clear();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}