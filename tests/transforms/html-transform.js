/**
 * HTML Transform for Jest
 * Extracts JavaScript from HTML files for testing
 */

import fs from 'fs';

export default {
  process(src, filename) {
    // Extract script content from HTML
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const scripts = [];
    let match;

    while ((match = scriptRegex.exec(src)) !== null) {
      scripts.push(match[1]);
    }

    // Combine all scripts
    const combinedScript = scripts.join('\n\n');

    // Wrap in module exports for Jest
    return `
      module.exports = {
        html: ${JSON.stringify(src)},
        scripts: ${JSON.stringify(scripts)},
        execute: function(global) {
          ${combinedScript}
          
          // Export commonly tested functions
          if (typeof generatePrompts !== 'undefined') global.generatePrompts = generatePrompts;
          if (typeof updateValidation !== 'undefined') global.updateValidation = updateValidation;
          if (typeof saveSession !== 'undefined') global.saveSession = saveSession;
          if (typeof loadSession !== 'undefined') global.loadSession = loadSession;
          if (typeof handleFileUpload !== 'undefined') global.handleFileUpload = handleFileUpload;
          if (typeof updateCharacterCount !== 'undefined') global.updateCharacterCount = updateCharacterCount;
          if (typeof generateClaudePrompt !== 'undefined') global.generateClaudePrompt = generateClaudePrompt;
          if (typeof generateGeminiPrompt !== 'undefined') global.generateGeminiPrompt = generateGeminiPrompt;
          if (typeof appState !== 'undefined') global.appState = appState;
          if (typeof elements !== 'undefined') global.elements = elements;
        }
      };
    `;
  }
};