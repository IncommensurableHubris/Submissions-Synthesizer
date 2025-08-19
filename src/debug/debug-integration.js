/**
 * Debug Integration Script
 * Integrates logging and error handling into the main application
 */

(function() {
  'use strict';
  
  // Initialize debugging system
  function initializeDebugging() {
    // Create error handler with logger
    const errorHandler = new ErrorHandler(logger);
    
    // Make globally available
    window.errorHandler = errorHandler;
    
    // Enhance existing functions with debugging
    enhanceAppFunctions();
    
    // Setup debug UI
    setupDebugUI();
    
    // Setup performance monitoring
    setupPerformanceMonitoring();
    
    logger.info('Debug system initialized');
  }
  
  function enhanceAppFunctions() {
    // Enhance file upload function
    if (window.handleFileUpload) {
      const originalHandleFileUpload = window.handleFileUpload;
      window.handleFileUpload = async function(event) {
        const fileName = event.target.files[0]?.name;
        const fileSize = event.target.files[0]?.size;
        const fileType = event.target.files[0]?.type;
        
        logger.startTimer('fileUpload');
        logger.info('File upload started', { fileName, fileSize, fileType });
        
        try {
          const result = await originalHandleFileUpload.call(this, event);
          const duration = logger.endTimer('fileUpload')?.duration;
          
          logger.logFileUpload(fileName, fileSize, fileType, duration, true);
          return result;
        } catch (error) {
          const duration = logger.endTimer('fileUpload')?.duration;
          logger.logFileUpload(fileName, fileSize, fileType, duration, false, error);
          
          return await errorHandler.handleError(error, {
            operation: 'fileUpload',
            fileName,
            fileSize,
            fileType
          });
        }
      };
    }
    
    // Enhance prompt generation
    if (window.generatePrompts) {
      const originalGeneratePrompts = window.generatePrompts;
      window.generatePrompts = function() {
        logger.startTimer('promptGeneration');
        logger.info('Prompt generation started');
        
        try {
          const result = originalGeneratePrompts.call(this);
          const duration = logger.endTimer('promptGeneration')?.duration;
          
          // Calculate input/output sizes
          const inputSize = JSON.stringify(window.appState || {}).length;
          const claudeOutput = document.getElementById('claudePromptOutput')?.textContent?.length || 0;
          const geminiOutput = document.getElementById('geminiPromptOutput')?.textContent?.length || 0;
          const outputSize = claudeOutput + geminiOutput;
          
          logger.logPromptGeneration(window.appState?.platform, inputSize, outputSize, duration, true);
          return result;
        } catch (error) {
          const duration = logger.endTimer('promptGeneration')?.duration;
          logger.logPromptGeneration(window.appState?.platform, 0, 0, duration, false, error);
          
          errorHandler.handleError(error, {
            operation: 'promptGeneration',
            platform: window.appState?.platform
          });
        }
      };
    }
    
    // Enhance session management
    if (window.saveSession) {
      const originalSaveSession = window.saveSession;
      window.saveSession = function() {
        logger.info('Session save started');
        try {
          const result = originalSaveSession.call(this);
          logger.info('Session saved successfully');
          return result;
        } catch (error) {
          errorHandler.handleError(error, { operation: 'sessionSave' });
        }
      };
    }
    
    if (window.loadSession) {
      const originalLoadSession = window.loadSession;
      window.loadSession = function() {
        logger.info('Session load started');
        try {
          const result = originalLoadSession.call(this);
          logger.info('Session loaded successfully');
          return result;
        } catch (error) {
          errorHandler.handleError(error, { operation: 'sessionLoad' });
        }
      };
    }
    
    // Enhance validation
    if (window.updateValidation) {
      const originalUpdateValidation = window.updateValidation;
      window.updateValidation = function() {
        try {
          const result = originalUpdateValidation.call(this);
          
          // Log validation results
          const warnings = document.getElementById('validationWarnings')?.children?.length || 0;
          logger.debug('Validation updated', { warningCount: warnings });
          
          return result;
        } catch (error) {
          errorHandler.handleError(error, { operation: 'validation' });
        }
      };
    }
  }
  
  function setupDebugUI() {
    // Only show debug UI if debug mode is enabled
    if (!window.location.search.includes('debug') && 
        localStorage.getItem('debug-log-level') !== 'DEBUG') {
      return;
    }
    
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      width: 300px;
      height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border-radius: 4px;
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;
    
    debugPanel.innerHTML = `
      <div style="background: #333; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>Debug Console</span>
        <div>
          <button id="debug-clear" style="background: #666; color: white; border: none; padding: 2px 6px; margin-right: 4px; border-radius: 2px; cursor: pointer;">Clear</button>
          <button id="debug-close" style="background: #d32f2f; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer;">&times;</button>
        </div>
      </div>
      <div id="debug-tabs" style="background: #444; display: flex;">
        <button class="debug-tab active" data-tab="logs" style="background: #555; color: white; border: none; padding: 4px 8px; cursor: pointer;">Logs</button>
        <button class="debug-tab" data-tab="metrics" style="background: #444; color: white; border: none; padding: 4px 8px; cursor: pointer;">Metrics</button>
        <button class="debug-tab" data-tab="memory" style="background: #444; color: white; border: none; padding: 4px 8px; cursor: pointer;">Memory</button>
      </div>
      <div id="debug-content" style="flex: 1; overflow-y: auto; padding: 8px;">
        <div id="debug-logs" class="debug-tab-content">
          <div id="log-entries" style="font-size: 11px; line-height: 1.3;"></div>
        </div>
        <div id="debug-metrics" class="debug-tab-content" style="display: none;">
          <div id="metrics-content"></div>
        </div>
        <div id="debug-memory" class="debug-tab-content" style="display: none;">
          <div id="memory-content"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Setup debug panel functionality
    setupDebugPanelControls(debugPanel);
    
    // Create debug toggle button
    const debugToggle = document.createElement('button');
    debugToggle.id = 'debug-toggle';
    debugToggle.textContent = 'Debug';
    debugToggle.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 80px;
      background: #2196F3;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 9999;
      font-size: 12px;
    `;
    
    debugToggle.addEventListener('click', () => {
      debugPanel.style.display = debugPanel.style.display === 'none' ? 'flex' : 'none';
      updateDebugContent();
    });
    
    document.body.appendChild(debugToggle);
    
    // Update debug content periodically
    setInterval(updateDebugContent, 1000);
  }
  
  function setupDebugPanelControls(panel) {
    // Tab switching
    const tabs = panel.querySelectorAll('.debug-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const contents = panel.querySelectorAll('.debug-tab-content');
        contents.forEach(c => c.style.display = 'none');
        
        const targetContent = panel.querySelector(`#debug-${tab.dataset.tab}`);
        if (targetContent) {
          targetContent.style.display = 'block';
        }
        
        updateDebugContent();
      });
    });
    
    // Close button
    panel.querySelector('#debug-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });
    
    // Clear button
    panel.querySelector('#debug-clear').addEventListener('click', () => {
      logger.clearLogs();
      updateDebugContent();
    });
  }
  
  function updateDebugContent() {
    const panel = document.getElementById('debug-panel');
    if (!panel || panel.style.display === 'none') return;
    
    const activeTab = panel.querySelector('.debug-tab.active')?.dataset.tab;
    
    switch (activeTab) {
      case 'logs':
        updateLogsContent();
        break;
      case 'metrics':
        updateMetricsContent();
        break;
      case 'memory':
        updateMemoryContent();
        break;
    }
  }
  
  function updateLogsContent() {
    const logEntries = document.getElementById('log-entries');
    if (!logEntries) return;
    
    const logs = logger.logs.slice(-50); // Show last 50 logs
    
    logEntries.innerHTML = logs.map(log => {
      const color = {
        DEBUG: '#888',
        INFO: '#2196F3',
        WARN: '#FF9800',
        ERROR: '#F44336',
        CRITICAL: '#D32F2F'
      }[log.level] || '#FFF';
      
      return `
        <div style="margin-bottom: 4px; color: ${color};">
          <span style="color: #AAA;">${new Date(log.timestamp).toLocaleTimeString()}</span>
          <span style="color: ${color};">[${log.level}]</span>
          ${log.message}
          ${Object.keys(log.data).length ? `<br><span style="color: #CCC; font-size: 10px;">${JSON.stringify(log.data)}</span>` : ''}
        </div>
      `;
    }).join('');
    
    // Auto-scroll to bottom
    logEntries.scrollTop = logEntries.scrollHeight;
  }
  
  function updateMetricsContent() {
    const metricsContent = document.getElementById('metrics-content');
    if (!metricsContent) return;
    
    const metrics = logger.getMetrics();
    const errorStats = errorHandler.getErrorStats();
    
    metricsContent.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>Session:</strong> ${Math.round(metrics.sessionDuration / 1000)}s<br>
        <strong>Total Logs:</strong> ${metrics.totalLogs}<br>
        <strong>Errors:</strong> ${errorStats.totalErrors}
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong>Log Levels:</strong><br>
        ${Object.entries(metrics.logsByLevel).map(([level, count]) => 
          `<span style="color: ${level === 'ERROR' ? '#F44336' : '#FFF'}">${level}: ${count}</span>`
        ).join('<br>')}
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong>File Uploads:</strong> ${metrics.fileUploads.length}<br>
        <strong>Prompt Generations:</strong> ${metrics.promptGenerations.length}<br>
        <strong>UI Interactions:</strong> ${metrics.uiInteractions.length}
      </div>
      
      <div>
        <strong>Error Types:</strong><br>
        ${Object.entries(errorStats.errorCounts).map(([type, count]) => 
          `${type}: ${count}`
        ).join('<br>')}
      </div>
    `;
  }
  
  function updateMemoryContent() {
    const memoryContent = document.getElementById('memory-content');
    if (!memoryContent) return;
    
    const memoryInfo = logger.logMemoryUsage();
    
    if (memoryInfo) {
      const usedMB = Math.round(memoryInfo.used / 1024 / 1024);
      const totalMB = Math.round(memoryInfo.total / 1024 / 1024);
      const limitMB = Math.round(memoryInfo.limit / 1024 / 1024);
      const usagePercent = Math.round((memoryInfo.used / memoryInfo.limit) * 100);
      
      memoryContent.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong>Memory Usage:</strong><br>
          Used: ${usedMB} MB<br>
          Total: ${totalMB} MB<br>
          Limit: ${limitMB} MB<br>
          Usage: ${usagePercent}%
        </div>
        
        <div style="background: #333; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 8px;">
          <div style="background: ${usagePercent > 80 ? '#F44336' : '#4CAF50'}; height: 100%; width: ${usagePercent}%; transition: width 0.3s;"></div>
        </div>
        
        <div style="font-size: 10px; color: #AAA;">
          LocalStorage: ~${Math.round(JSON.stringify(localStorage).length / 1024)} KB
        </div>
      `;
    } else {
      memoryContent.innerHTML = `
        <div style="color: #AAA;">
          Memory information not available in this browser.
        </div>
      `;
    }
  }
  
  function setupPerformanceMonitoring() {
    // Monitor page performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            logger.info('Page loaded', {
              loadTime: entry.loadEventEnd - entry.loadEventStart,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              responseTime: entry.responseEnd - entry.requestStart
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observation not supported
      }
    }
    
    // Monitor memory periodically
    setInterval(() => {
      const memoryInfo = logger.logMemoryUsage();
      if (memoryInfo && memoryInfo.used > memoryInfo.limit * 0.8) {
        logger.warn('High memory usage detected', memoryInfo);
      }
    }, 30000); // Check every 30 seconds
  }
  
  function enhanceUIInteractionLogging() {
    // Log form interactions
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.id) {
        input.addEventListener('change', () => {
          logger.logUIInteraction('input_change', input, {
            id: input.id,
            type: input.type,
            valueLength: input.value?.length || 0
          });
        });
      }
    });
    
    // Log button clicks
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        logger.logUIInteraction('button_click', button, {
          id: button.id,
          text: button.textContent?.trim()
        });
      });
    });
    
    // Log tab switches
    const tabs = document.querySelectorAll('.template-tab, .output-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        logger.logUIInteraction('tab_switch', tab, {
          tab: tab.dataset.tab || tab.dataset.output
        });
      });
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDebugging);
  } else {
    initializeDebugging();
  }
  
  // Initialize UI interaction logging after a delay to ensure all elements are present
  setTimeout(enhanceUIInteractionLogging, 1000);
  
})();