/**
 * Core Functions Unit Tests
 * Tests the main functionality of the Subs Prompt Generator
 */

describe('Core Functions', () => {
  let mockHTML;
  let appState;
  let elements;

  beforeEach(() => {
    // Load and execute the HTML content
    mockHTML = require('../../index.html');
    
    // Create DOM elements for testing
    document.body.innerHTML = `
      <input type="radio" name="platform" value="claude" checked>
      <input type="radio" name="platform" value="gemini">
      <input type="radio" name="platform" value="both">
      <input type="radio" name="position" value="applicant" checked>
      <input type="radio" name="position" value="respondent">
      <textarea id="chronology"></textarea>
      <textarea id="arguments"></textarea>
      <textarea id="templateText"></textarea>
      <textarea id="instructions"></textarea>
      <textarea id="opposingSubmissions"></textarea>
      <textarea id="plaintiffPleadings"></textarea>
      <textarea id="defendantPleadings"></textarea>
      <textarea id="summonsApplication"></textarea>
      <input type="checkbox" id="includeChecklist" checked>
      <input type="file" id="templateFile">
      <div id="uploadStatus"></div>
      <span id="chronologyCounter"></span>
      <span id="argumentsCounter"></span>
      <span id="templateCounter"></span>
      <span id="instructionsCounter"></span>
      <span id="opposingSubmissionsCounter"></span>
      <span id="plaintiffPleadingsCounter"></span>
      <span id="defendantPleadingsCounter"></span>
      <span id="summonsApplicationCounter"></span>
      <div id="validationWarnings"></div>
      <div id="outputSection"></div>
      <button id="generateBtn"></button>
      <div id="generateText"></div>
      <div id="generateLoading"></div>
    `;

    // Execute the HTML scripts in global scope
    mockHTML.execute(global);
    
    // Get the initialized state and elements
    appState = global.appState;
    elements = global.elements;
  });

  describe('Application State Management', () => {
    test('should initialize with default state', () => {
      expect(appState).toBeDefined();
      expect(appState.platform).toBe('claude');
      expect(appState.position).toBe('applicant');
      expect(appState.chronology).toBe('');
      expect(appState.arguments).toBe('');
      expect(appState.includeChecklist).toBe(true);
    });

    test('should update platform state', () => {
      const claudeRadio = document.querySelector('input[name="platform"][value="claude"]');
      const geminiRadio = document.querySelector('input[name="platform"][value="gemini"]');
      
      geminiRadio.checked = true;
      geminiRadio.dispatchEvent(new Event('change'));
      
      expect(appState.platform).toBe('gemini');
    });

    test('should update position state', () => {
      const respondentRadio = document.querySelector('input[name="position"][value="respondent"]');
      
      respondentRadio.checked = true;
      respondentRadio.dispatchEvent(new Event('change'));
      
      expect(appState.position).toBe('respondent');
    });
  });

  describe('Character Count Functionality', () => {
    test('should update character count correctly', () => {
      const testText = 'This is a test string with 45 characters.';
      const chronologyTextarea = document.getElementById('chronology');
      const counter = document.getElementById('chronologyCounter');
      
      chronologyTextarea.value = testText;
      chronologyTextarea.dispatchEvent(new Event('input'));
      
      expect(counter.textContent).toContain(testText.length.toString());
    });

    test('should handle empty text input', () => {
      const chronologyTextarea = document.getElementById('chronology');
      const counter = document.getElementById('chronologyCounter');
      
      chronologyTextarea.value = '';
      chronologyTextarea.dispatchEvent(new Event('input'));
      
      expect(counter.textContent).toContain('0');
    });

    test('should update state when text changes', () => {
      const testText = 'Test chronology content';
      const chronologyTextarea = document.getElementById('chronology');
      
      chronologyTextarea.value = testText;
      chronologyTextarea.dispatchEvent(new Event('input'));
      
      expect(appState.chronology).toBe(testText);
    });
  });

  describe('Validation System', () => {
    test('should validate required fields', () => {
      // Test with empty required fields
      global.updateValidation();
      
      const validationWarnings = document.getElementById('validationWarnings');
      expect(validationWarnings.style.display).not.toBe('none');
    });

    test('should pass validation with all required fields filled', () => {
      // Fill required fields
      appState.chronology = 'Test chronology';
      appState.arguments = 'Test arguments';
      appState.templateText = 'Test template';
      
      document.getElementById('chronology').value = appState.chronology;
      document.getElementById('arguments').value = appState.arguments;
      document.getElementById('templateText').value = appState.templateText;
      
      global.updateValidation();
      
      const validationWarnings = document.getElementById('validationWarnings');
      expect(validationWarnings.children.length).toBe(0);
    });

    test('should handle validation edge cases', () => {
      // Test with whitespace-only content
      appState.chronology = '   ';
      appState.arguments = '\n\n\n';
      appState.templateText = '\t\t';
      
      global.updateValidation();
      
      const validationWarnings = document.getElementById('validationWarnings');
      expect(validationWarnings.style.display).not.toBe('none');
    });
  });

  describe('Prompt Generation', () => {
    beforeEach(() => {
      // Set up valid state for prompt generation
      appState.chronology = 'Test chronology content';
      appState.arguments = 'Test arguments content';
      appState.templateText = 'Test template content';
      appState.instructions = 'Test instructions';
      appState.platform = 'claude';
      appState.position = 'applicant';
    });

    test('should generate Claude prompt successfully', () => {
      const prompt = global.generateClaudePrompt();
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('chronology');
      expect(prompt).toContain('arguments');
      expect(prompt).toContain('template');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should generate Gemini prompt successfully', () => {
      const prompt = global.generateGeminiPrompt();
      
      expect(prompt).toBeDefined();
      expect(prompt).toContain('chronology');
      expect(prompt).toContain('arguments');
      expect(prompt).toContain('template');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should adapt prompts based on position', () => {
      // Test applicant position
      appState.position = 'applicant';
      const applicantPrompt = global.generateClaudePrompt();
      
      // Test respondent position
      appState.position = 'respondent';
      const respondentPrompt = global.generateClaudePrompt();
      
      expect(applicantPrompt).not.toBe(respondentPrompt);
      expect(applicantPrompt).toContain('applicant');
      expect(respondentPrompt).toContain('respondent');
    });

    test('should include checklist when enabled', () => {
      appState.includeChecklist = true;
      const promptWithChecklist = global.generateClaudePrompt();
      
      appState.includeChecklist = false;
      const promptWithoutChecklist = global.generateClaudePrompt();
      
      expect(promptWithChecklist.length).toBeGreaterThan(promptWithoutChecklist.length);
    });
  });

  describe('Session Management', () => {
    test('should save session to localStorage', () => {
      appState.chronology = 'Test save data';
      appState.arguments = 'Test arguments data';
      
      global.saveSession();
      
      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData.chronology).toBe('Test save data');
      expect(savedData.arguments).toBe('Test arguments data');
    });

    test('should load session from localStorage', () => {
      const testData = {
        chronology: 'Loaded chronology',
        arguments: 'Loaded arguments',
        platform: 'gemini',
        position: 'respondent'
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      global.loadSession();
      
      expect(appState.chronology).toBe('Loaded chronology');
      expect(appState.arguments).toBe('Loaded arguments');
      expect(appState.platform).toBe('gemini');
      expect(appState.position).toBe('respondent');
    });

    test('should handle invalid session data gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => global.loadSession()).not.toThrow();
      
      localStorage.getItem.mockReturnValue(null);
      expect(() => global.loadSession()).not.toThrow();
    });

    test('should validate session file structure', () => {
      const validSession = {
        platform: 'claude',
        position: 'applicant',
        chronology: 'test',
        arguments: 'test'
      };
      
      const invalidSession = {
        invalidField: 'test'
      };
      
      expect(global.validateSessionFile(validSession)).toBe(true);
      expect(global.validateSessionFile(invalidSession)).toBe(false);
      expect(global.validateSessionFile(null)).toBe(false);
      expect(global.validateSessionFile('string')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle file upload errors gracefully', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      expect(() => global.handleFileUpload(mockEvent)).not.toThrow();
    });

    test('should handle large file uploads', () => {
      const largeContent = 'x'.repeat(10000000); // 10MB
      const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      expect(() => global.handleFileUpload(mockEvent)).not.toThrow();
    });
  });
});