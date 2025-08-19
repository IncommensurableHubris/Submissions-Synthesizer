/**
 * UI Workflow Integration Tests
 * Tests complete user workflows and UI interactions
 */

describe('UI Workflow Integration Tests', () => {
  let mockHTML;
  let appState;

  beforeEach(() => {
    mockHTML = require('../../index.html');
    
    // Create complete DOM structure for integration testing
    document.body.innerHTML = `
      <div class="container">
        <div class="platform-selection">
          <input type="radio" name="platform" value="claude" id="platformClaude" checked>
          <label for="platformClaude">Claude</label>
          <input type="radio" name="platform" value="gemini" id="platformGemini">
          <label for="platformGemini">Gemini</label>
          <input type="radio" name="platform" value="both" id="platformBoth">
          <label for="platformBoth">Both</label>
        </div>
        
        <div class="position-selection">
          <input type="radio" name="position" value="applicant" id="positionApplicant" checked>
          <label for="positionApplicant">Applicant</label>
          <input type="radio" name="position" value="respondent" id="positionRespondent">
          <label for="positionRespondent">Respondent</label>
        </div>
        
        <div class="input-section">
          <textarea id="chronology" placeholder="Enter chronology..."></textarea>
          <span id="chronologyCounter">0 characters</span>
          <span id="chronologyStatus" class="section-status"></span>
          
          <textarea id="arguments" placeholder="Enter arguments..."></textarea>
          <span id="argumentsCounter">0 characters</span>
          <span id="argumentsStatus" class="section-status"></span>
          
          <div class="template-tabs">
            <div class="template-tab active" data-tab="paste">Paste</div>
            <div class="template-tab" data-tab="upload">Upload</div>
          </div>
          
          <div class="template-content" id="pasteContent">
            <textarea id="templateText" placeholder="Paste template..."></textarea>
            <span id="templateCounter">0 characters</span>
            <span id="templateStatus" class="section-status"></span>
          </div>
          
          <div class="template-content" id="uploadContent" style="display: none;">
            <input type="file" id="templateFile">
            <div id="fileUpload">Drop file here or click to browse</div>
            <div id="uploadStatus"></div>
          </div>
          
          <textarea id="instructions" placeholder="Enter instructions..."></textarea>
          <span id="instructionsCounter">0 characters</span>
          <span id="instructionsStatus" class="section-status"></span>
          
          <div id="opposingSubmissionsGroup">
            <textarea id="opposingSubmissions" placeholder="Enter opposing submissions..."></textarea>
            <span id="opposingSubmissionsCounter">0 characters</span>
          </div>
          
          <div id="pleadingsTabs" class="template-tabs">
            <div class="template-tab active" data-tab="plaintiff">Plaintiff</div>
            <div class="template-tab" data-tab="defendant">Defendant</div>
          </div>
          
          <div class="template-content" id="plaintiffContent">
            <textarea id="plaintiffPleadings"></textarea>
            <span id="plaintiffPleadingsCounter">0 characters</span>
          </div>
          
          <div class="template-content" id="defendantContent" style="display: none;">
            <textarea id="defendantPleadings"></textarea>
            <span id="defendantPleadingsCounter">0 characters</span>
          </div>
          
          <textarea id="summonsApplication"></textarea>
          <span id="summonsApplicationCounter">0 characters</span>
          
          <input type="checkbox" id="includeChecklist" checked>
          <label for="includeChecklist">Include checklist</label>
        </div>
        
        <div class="validation-warnings" id="validationWarnings"></div>
        <div class="validation-positive" id="validationPositive" style="display: none;"></div>
        
        <button id="generateBtn" class="generate-btn">
          <span id="generateText">Generate Prompts</span>
          <span id="generateLoading" style="display: none;">Generating...</span>
        </button>
        
        <div id="outputSection" style="display: none;">
          <div class="output-tabs">
            <div class="output-tab active" data-output="claude">Claude</div>
            <div class="output-tab" data-output="gemini">Gemini</div>
            <div class="output-tab" data-output="claude2">Claude (Alt)</div>
            <div class="output-tab" data-output="gemini2">Gemini (Alt)</div>
          </div>
          
          <div class="output-content active" id="claudeOutput">
            <pre id="claudePromptOutput"></pre>
            <button id="copyClaude">Copy</button>
          </div>
          
          <div class="output-content" id="geminiOutput">
            <pre id="geminiPromptOutput"></pre>
            <button id="copyGemini">Copy</button>
          </div>
          
          <div class="output-content" id="claude2Output">
            <pre id="claude2PromptOutput"></pre>
            <button id="copyClaude2">Copy</button>
          </div>
          
          <div class="output-content" id="gemini2Output">
            <pre id="gemini2PromptOutput"></pre>
            <button id="copyGemini2">Copy</button>
          </div>
        </div>
        
        <div class="session-controls">
          <button id="loadSession">Load Session</button>
          <button id="saveSession">Save Session</button>
          <button id="clearAll">Clear All</button>
          <input type="file" id="sessionFileInput" style="display: none;">
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" id="overallProgress"></div>
        </div>
        <div class="progress-text" id="progressText">Form completion: 0%</div>
      </div>
    `;

    mockHTML.execute(global);
    appState = global.appState;
  });

  describe('Complete User Workflows', () => {
    test('should complete full applicant workflow', async () => {
      // Step 1: Select platform and position
      const claudeRadio = document.getElementById('platformClaude');
      const applicantRadio = document.getElementById('positionApplicant');
      
      expect(claudeRadio.checked).toBe(true);
      expect(applicantRadio.checked).toBe(true);
      
      // Step 2: Fill chronology
      const chronologyTextarea = document.getElementById('chronology');
      const testChronology = 'Jan 1, 2024: Contract signed\nFeb 1, 2024: Breach occurred\nMar 1, 2024: Notice sent';
      
      chronologyTextarea.value = testChronology;
      chronologyTextarea.dispatchEvent(new Event('input'));
      
      expect(appState.chronology).toBe(testChronology);
      expect(document.getElementById('chronologyCounter').textContent).toContain(testChronology.length.toString());
      
      // Step 3: Fill arguments
      const argumentsTextarea = document.getElementById('arguments');
      const testArguments = 'Breach of contract\nDamages: $10,000\nInjunctive relief sought';
      
      argumentsTextarea.value = testArguments;
      argumentsTextarea.dispatchEvent(new Event('input'));
      
      expect(appState.arguments).toBe(testArguments);
      
      // Step 4: Add template via paste
      const templateTextarea = document.getElementById('templateText');
      const testTemplate = 'MOTION FOR SUMMARY JUDGMENT\n\nTO THE HONORABLE COURT:\n\nPlaintiff respectfully moves...';
      
      templateTextarea.value = testTemplate;
      templateTextarea.dispatchEvent(new Event('input'));
      
      expect(appState.templateText).toBe(testTemplate);
      
      // Step 5: Add instructions
      const instructionsTextarea = document.getElementById('instructions');
      const testInstructions = 'Please ensure proper citation format\nUse formal legal language\nInclude damages calculation';
      
      instructionsTextarea.value = testInstructions;
      instructionsTextarea.dispatchEvent(new Event('input'));
      
      expect(appState.instructions).toBe(testInstructions);
      
      // Step 6: Verify validation passes
      global.updateValidation();
      const validationWarnings = document.getElementById('validationWarnings');
      expect(validationWarnings.children.length).toBe(0);
      
      // Step 7: Generate prompts
      const generateBtn = document.getElementById('generateBtn');
      generateBtn.click();
      
      // Verify output section becomes visible
      const outputSection = document.getElementById('outputSection');
      expect(outputSection.style.display).not.toBe('none');
      
      // Verify prompt content
      const claudeOutput = document.getElementById('claudePromptOutput');
      expect(claudeOutput.textContent).toContain(testChronology);
      expect(claudeOutput.textContent).toContain(testArguments);
      expect(claudeOutput.textContent).toContain(testTemplate);
    });

    test('should complete full respondent workflow', async () => {
      // Step 1: Switch to respondent position
      const respondentRadio = document.getElementById('positionRespondent');
      respondentRadio.checked = true;
      respondentRadio.dispatchEvent(new Event('change'));
      
      expect(appState.position).toBe('respondent');
      
      // Step 2: Verify UI adapts for respondent
      const opposingSubmissionsGroup = document.getElementById('opposingSubmissionsGroup');
      expect(opposingSubmissionsGroup.style.display).not.toBe('none');
      
      // Step 3: Fill opposing submissions
      const opposingSubmissionsTextarea = document.getElementById('opposingSubmissions');
      const testOpposingSubmissions = 'Plaintiff claims breach of contract\nSeeks $10,000 damages\nRequests injunctive relief';
      
      opposingSubmissionsTextarea.value = testOpposingSubmissions;
      opposingSubmissionsTextarea.dispatchEvent(new Event('input'));
      
      expect(appState.opposingSubmissions).toBe(testOpposingSubmissions);
      
      // Continue with standard workflow...
      const chronologyTextarea = document.getElementById('chronology');
      chronologyTextarea.value = 'Defense chronology';
      chronologyTextarea.dispatchEvent(new Event('input'));
      
      const argumentsTextarea = document.getElementById('arguments');
      argumentsTextarea.value = 'No breach occurred\nDamages are speculative\nInjunctive relief inappropriate';
      argumentsTextarea.dispatchEvent(new Event('input'));
      
      const templateTextarea = document.getElementById('templateText');
      templateTextarea.value = 'RESPONSE TO MOTION\n\nDefendant respectfully opposes...';
      templateTextarea.dispatchEvent(new Event('input'));
      
      // Generate and verify respondent-specific content
      document.getElementById('generateBtn').click();
      
      const claudeOutput = document.getElementById('claudePromptOutput');
      expect(claudeOutput.textContent).toContain('respondent');
      expect(claudeOutput.textContent).toContain('opposing');
    });

    test('should handle file upload workflow', async () => {
      // Step 1: Switch to upload tab
      const uploadTab = document.querySelector('.template-tab[data-tab="upload"]');
      uploadTab.click();
      
      // Verify tab switch
      expect(uploadTab.classList.contains('active')).toBe(true);
      expect(document.getElementById('uploadContent').style.display).not.toBe('none');
      expect(document.getElementById('pasteContent').style.display).toBe('none');
      
      // Step 2: Simulate file upload
      const mockFile = new File(['Template content from file'], 'template.txt', { type: 'text/plain' });
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      await global.handleFileUpload(mockEvent);
      
      // Verify file content is loaded
      expect(appState.templateText).toBe('Template content from file');
      
      // Verify upload status
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('successfully');
      
      // Verify tab automatically switches back to paste to show content
      expect(document.getElementById('pasteContent').style.display).not.toBe('none');
    });
  });

  describe('Tab Navigation', () => {
    test('should switch template tabs correctly', () => {
      const pasteTab = document.querySelector('.template-tab[data-tab="paste"]');
      const uploadTab = document.querySelector('.template-tab[data-tab="upload"]');
      
      // Initially paste tab is active
      expect(pasteTab.classList.contains('active')).toBe(true);
      expect(uploadTab.classList.contains('active')).toBe(false);
      
      // Click upload tab
      uploadTab.click();
      
      expect(uploadTab.classList.contains('active')).toBe(true);
      expect(pasteTab.classList.contains('active')).toBe(false);
      expect(document.getElementById('uploadContent').style.display).not.toBe('none');
      expect(document.getElementById('pasteContent').style.display).toBe('none');
      
      // Click back to paste tab
      pasteTab.click();
      
      expect(pasteTab.classList.contains('active')).toBe(true);
      expect(uploadTab.classList.contains('active')).toBe(false);
    });

    test('should switch pleadings tabs correctly', () => {
      const plaintiffTab = document.querySelector('#pleadingsTabs .template-tab[data-tab="plaintiff"]');
      const defendantTab = document.querySelector('#pleadingsTabs .template-tab[data-tab="defendant"]');
      
      // Initially plaintiff tab is active
      expect(plaintiffTab.classList.contains('active')).toBe(true);
      
      // Click defendant tab
      defendantTab.click();
      
      expect(defendantTab.classList.contains('active')).toBe(true);
      expect(plaintiffTab.classList.contains('active')).toBe(false);
      expect(document.getElementById('defendantContent').style.display).not.toBe('none');
      expect(document.getElementById('plaintiffContent').style.display).toBe('none');
    });

    test('should switch output tabs correctly', () => {
      // First generate content to make output visible
      document.getElementById('chronology').value = 'test';
      document.getElementById('arguments').value = 'test';
      document.getElementById('templateText').value = 'test';
      document.getElementById('generateBtn').click();
      
      const claudeTab = document.querySelector('.output-tab[data-output="claude"]');
      const geminiTab = document.querySelector('.output-tab[data-output="gemini"]');
      
      // Initially Claude tab is active
      expect(claudeTab.classList.contains('active')).toBe(true);
      
      // Click Gemini tab
      geminiTab.click();
      
      expect(geminiTab.classList.contains('active')).toBe(true);
      expect(claudeTab.classList.contains('active')).toBe(false);
      expect(document.getElementById('geminiOutput').classList.contains('active')).toBe(true);
      expect(document.getElementById('claudeOutput').classList.contains('active')).toBe(false);
    });
  });

  describe('Session Management Workflow', () => {
    test('should save and load complete session', () => {
      // Fill out complete form
      appState.platform = 'gemini';
      appState.position = 'respondent';
      appState.chronology = 'Session test chronology';
      appState.arguments = 'Session test arguments';
      appState.templateText = 'Session test template';
      appState.instructions = 'Session test instructions';
      appState.opposingSubmissions = 'Session test opposing';
      appState.includeChecklist = false;
      
      // Update UI to match state
      document.getElementById('platformGemini').checked = true;
      document.getElementById('positionRespondent').checked = true;
      document.getElementById('chronology').value = appState.chronology;
      document.getElementById('arguments').value = appState.arguments;
      document.getElementById('templateText').value = appState.templateText;
      document.getElementById('instructions').value = appState.instructions;
      document.getElementById('opposingSubmissions').value = appState.opposingSubmissions;
      document.getElementById('includeChecklist').checked = false;
      
      // Save session
      document.getElementById('saveSession').click();
      
      expect(localStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);
      expect(savedData.platform).toBe('gemini');
      expect(savedData.position).toBe('respondent');
      expect(savedData.chronology).toBe('Session test chronology');
      
      // Clear form
      document.getElementById('clearAll').click();
      
      expect(appState.chronology).toBe('');
      expect(appState.arguments).toBe('');
      expect(document.getElementById('chronology').value).toBe('');
      
      // Load session
      localStorage.getItem.mockReturnValue(JSON.stringify(savedData));
      document.getElementById('loadSession').click();
      
      expect(appState.platform).toBe('gemini');
      expect(appState.position).toBe('respondent');
      expect(appState.chronology).toBe('Session test chronology');
      expect(document.getElementById('chronology').value).toBe('Session test chronology');
    });

    test('should handle session file upload', async () => {
      const sessionData = {
        platform: 'claude',
        position: 'applicant',
        chronology: 'File session chronology',
        arguments: 'File session arguments',
        templateText: 'File session template'
      };
      
      const sessionFile = new File([JSON.stringify(sessionData)], 'session.json', { 
        type: 'application/json' 
      });
      
      // Simulate file selection for session load
      const sessionFileInput = document.getElementById('sessionFileInput');
      Object.defineProperty(sessionFileInput, 'files', {
        value: [sessionFile],
        writable: false
      });
      
      // Trigger file load
      await global.loadSessionFromFile(sessionFile);
      
      expect(appState.chronology).toBe('File session chronology');
      expect(appState.arguments).toBe('File session arguments');
      expect(appState.templateText).toBe('File session template');
    });
  });

  describe('Real-time Feedback and Progress', () => {
    test('should update progress indicators in real-time', () => {
      // Initially no progress
      expect(document.getElementById('progressText').textContent).toContain('0%');
      
      // Add chronology
      document.getElementById('chronology').value = 'test chronology';
      document.getElementById('chronology').dispatchEvent(new Event('input'));
      
      global.updateOverallProgress();
      
      // Progress should increase
      expect(document.getElementById('progressText').textContent).not.toContain('0%');
      
      // Add more fields
      document.getElementById('arguments').value = 'test arguments';
      document.getElementById('arguments').dispatchEvent(new Event('input'));
      
      document.getElementById('templateText').value = 'test template';
      document.getElementById('templateText').dispatchEvent(new Event('input'));
      
      global.updateOverallProgress();
      
      // Progress should continue increasing
      const progressText = document.getElementById('progressText').textContent;
      expect(progressText).toContain('%');
      expect(progressText).not.toContain('0%');
    });

    test('should show validation feedback in real-time', () => {
      // Initially should show validation warnings
      global.updateValidation();
      const validationWarnings = document.getElementById('validationWarnings');
      expect(validationWarnings.style.display).not.toBe('none');
      
      // Fill required fields
      document.getElementById('chronology').value = 'test';
      document.getElementById('chronology').dispatchEvent(new Event('input'));
      
      document.getElementById('arguments').value = 'test';
      document.getElementById('arguments').dispatchEvent(new Event('input'));
      
      document.getElementById('templateText').value = 'test';
      document.getElementById('templateText').dispatchEvent(new Event('input'));
      
      global.updateValidation();
      
      // Validation warnings should be cleared
      expect(validationWarnings.children.length).toBe(0);
      
      // Positive validation should show
      const validationPositive = document.getElementById('validationPositive');
      expect(validationPositive.style.display).not.toBe('none');
    });

    test('should update character counters accurately', () => {
      const testText = 'This is a test string with exactly fifty characters!';
      expect(testText.length).toBe(50);
      
      const chronologyTextarea = document.getElementById('chronology');
      const counter = document.getElementById('chronologyCounter');
      
      chronologyTextarea.value = testText;
      chronologyTextarea.dispatchEvent(new Event('input'));
      
      expect(counter.textContent).toContain('50');
    });
  });

  describe('Error Handling in Workflows', () => {
    test('should handle workflow interruptions gracefully', async () => {
      // Start normal workflow
      document.getElementById('chronology').value = 'test chronology';
      document.getElementById('chronology').dispatchEvent(new Event('input'));
      
      // Simulate error during file upload
      const corruptFile = new File(['corrupt'], 'corrupt.pdf', { type: 'application/pdf' });
      pdfjsLib.getDocument.mockReturnValue({
        promise: Promise.reject(new Error('PDF Error'))
      });
      
      const mockEvent = {
        target: { files: [corruptFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      // Workflow should continue despite file error
      expect(appState.chronology).toBe('test chronology');
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Error');
    });

    test('should recover from invalid session data', () => {
      // Try to load invalid session
      localStorage.getItem.mockReturnValue('{"invalid": "session"}');
      
      expect(() => global.loadSession()).not.toThrow();
      
      // State should remain intact
      expect(appState.platform).toBeDefined();
      expect(appState.position).toBeDefined();
    });
  });
});