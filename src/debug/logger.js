/**
 * Advanced Logging System for Subs Prompt Generator
 * Provides comprehensive logging with levels, filtering, and debugging capabilities
 */

class Logger {
  constructor() {
    // Log levels (must be defined first!)
    this.LEVELS = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };
    
    this.logLevel = this.getLogLevel();
    this.logs = [];
    this.maxLogs = 1000;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Performance tracking
    this.performanceMarks = new Map();
    this.metrics = {
      fileUploads: [],
      promptGenerations: [],
      uiInteractions: [],
      errors: []
    };
    
    this.initializeLogger();
  }
  
  initializeLogger() {
    // Capture global errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
    
    // Monitor performance
    if ('PerformanceObserver' in window) {
      this.setupPerformanceMonitoring();
    }
    
    this.info('Logger initialized', { sessionId: this.sessionId });
  }
  
  setupPerformanceMonitoring() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.debug('Performance Measure', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
  }
  
  getLogLevel() {
    // Check URL parameters for debug mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug')) {
      return this.LEVELS.DEBUG;
    }
    
    // Check localStorage for persistent debug setting
    const storedLevel = localStorage.getItem('debug-log-level');
    if (storedLevel && this.LEVELS[storedLevel] !== undefined) {
      return this.LEVELS[storedLevel];
    }
    
    // Default to INFO in development, WARN in production
    return window.location.hostname === 'localhost' ? this.LEVELS.INFO : this.LEVELS.WARN;
  }
  
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  shouldLog(level) {
    return this.LEVELS[level] >= this.logLevel;
  }
  
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const sessionTime = Date.now() - this.startTime;
    
    return {
      timestamp,
      sessionTime,
      sessionId: this.sessionId,
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: new Error().stack
    };
  }
  
  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;
    
    const logEntry = this.formatMessage(level, message, data);
    
    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output with styling
    this.consoleLog(level, logEntry);
    
    // Store critical errors
    if (level === 'ERROR' || level === 'CRITICAL') {
      this.metrics.errors.push(logEntry);
      this.persistCriticalError(logEntry);
    }
    
    return logEntry;
  }
  
  consoleLog(level, logEntry) {
    const styles = {
      DEBUG: 'color: #888; font-size: 11px;',
      INFO: 'color: #2196F3; font-weight: bold;',
      WARN: 'color: #FF9800; font-weight: bold;',
      ERROR: 'color: #F44336; font-weight: bold; background: #ffebee;',
      CRITICAL: 'color: white; font-weight: bold; background: #d32f2f; padding: 2px 4px;'
    };
    
    const prefix = `[${logEntry.timestamp}] [${level}] [${logEntry.sessionTime}ms]`;
    const style = styles[level] || '';
    
    if (level === 'ERROR' || level === 'CRITICAL') {
      console.group(`%c${prefix} ${logEntry.message}`, style);
      if (logEntry.data && Object.keys(logEntry.data).length > 0) {
        console.log('Data:', logEntry.data);
      }
      if (logEntry.stack) {
        console.log('Stack:', logEntry.stack);
      }
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${logEntry.message}`, style, logEntry.data);
    }
  }
  
  persistCriticalError(logEntry) {
    try {
      const errors = JSON.parse(localStorage.getItem('critical-errors') || '[]');
      errors.push(logEntry);
      
      // Keep only last 50 critical errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('critical-errors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to persist critical error:', e);
    }
  }
  
  // Logging methods
  debug(message, data = {}) {
    return this.log('DEBUG', message, data);
  }
  
  info(message, data = {}) {
    return this.log('INFO', message, data);
  }
  
  warn(message, data = {}) {
    return this.log('WARN', message, data);
  }
  
  error(message, data = {}) {
    return this.log('ERROR', message, data);
  }
  
  critical(message, data = {}) {
    return this.log('CRITICAL', message, data);
  }
  
  // Performance tracking
  startTimer(name) {
    this.performanceMarks.set(name, {
      start: Date.now(),
      startMark: `${name}-start`
    });
    
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
    
    this.debug('Timer started', { name });
  }
  
  endTimer(name) {
    const mark = this.performanceMarks.get(name);
    if (!mark) {
      this.warn('Timer not found', { name });
      return null;
    }
    
    const duration = Date.now() - mark.start;
    
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    
    this.performanceMarks.delete(name);
    
    const result = { name, duration };
    this.info('Timer completed', result);
    
    return result;
  }
  
  // Specialized logging methods
  logFileUpload(fileName, fileSize, fileType, duration, success = true, error = null) {
    const logData = {
      fileName,
      fileSize,
      fileType,
      duration,
      success,
      error: error?.message || null,
      timestamp: Date.now()
    };
    
    this.metrics.fileUploads.push(logData);
    
    if (success) {
      this.info('File upload completed', logData);
    } else {
      this.error('File upload failed', logData);
    }
  }
  
  logPromptGeneration(platform, inputSize, outputSize, duration, success = true, error = null) {
    const logData = {
      platform,
      inputSize,
      outputSize,
      duration,
      success,
      error: error?.message || null,
      timestamp: Date.now()
    };
    
    this.metrics.promptGenerations.push(logData);
    
    if (success) {
      this.info('Prompt generation completed', logData);
    } else {
      this.error('Prompt generation failed', logData);
    }
  }
  
  logUIInteraction(action, element, data = {}) {
    const logData = {
      action,
      element: element?.id || element?.className || 'unknown',
      data,
      timestamp: Date.now()
    };
    
    this.metrics.uiInteractions.push(logData);
    this.debug('UI interaction', logData);
  }
  
  // Security logging
  logSecurityEvent(eventType, severity, details = {}) {
    const logData = {
      eventType,
      severity,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    if (severity === 'high' || severity === 'critical') {
      this.error('Security event detected', logData);
    } else {
      this.warn('Security event detected', logData);
    }
  }
  
  // Memory and performance monitoring
  logMemoryUsage() {
    if (performance.memory) {
      const memoryInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      
      this.debug('Memory usage', memoryInfo);
      return memoryInfo;
    }
    return null;
  }
  
  // Export and analysis methods
  exportLogs(format = 'json') {
    const exportData = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      exportTime: Date.now(),
      logs: this.logs,
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.logsToCSV(this.logs);
    }
    
    return exportData;
  }
  
  logsToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = ['timestamp', 'sessionTime', 'level', 'message', 'data'];
    const rows = logs.map(log => [
      log.timestamp,
      log.sessionTime,
      log.level,
      log.message,
      JSON.stringify(log.data)
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      sessionDuration: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      logsByLevel: this.logs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {}),
      memoryUsage: this.logMemoryUsage()
    };
  }
  
  // Debugging utilities
  enableDebugMode() {
    this.logLevel = this.LEVELS.DEBUG;
    localStorage.setItem('debug-log-level', 'DEBUG');
    this.info('Debug mode enabled');
  }
  
  disableDebugMode() {
    this.logLevel = this.LEVELS.INFO;
    localStorage.setItem('debug-log-level', 'INFO');
    this.info('Debug mode disabled');
  }
  
  clearLogs() {
    this.logs = [];
    this.metrics = {
      fileUploads: [],
      promptGenerations: [],
      uiInteractions: [],
      errors: []
    };
    this.info('Logs cleared');
  }
  
  // Console commands for debugging
  setupConsoleCommands() {
    if (typeof window !== 'undefined') {
      window.debugLogger = {
        enable: () => this.enableDebugMode(),
        disable: () => this.disableDebugMode(),
        export: (format) => this.exportLogs(format),
        metrics: () => this.getMetrics(),
        clear: () => this.clearLogs(),
        logs: () => this.logs,
        memory: () => this.logMemoryUsage()
      };
      
      this.info('Debug console commands available at window.debugLogger');
    }
  }
}

// Create global logger instance
const logger = new Logger();
logger.setupConsoleCommands();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
} else if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
}