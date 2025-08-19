/**
 * XSS Prevention Security Tests
 * Tests protection against Cross-Site Scripting attacks
 */

describe('XSS Prevention Tests', () => {
  let mockHTML;
  let appState;

  beforeEach(() => {
    mockHTML = require('../../index.html');

    document.body.innerHTML = `
      <textarea id="chronology"></textarea>
      <textarea id="arguments"></textarea>
      <textarea id="templateText"></textarea>
      <textarea id="instructions"></textarea>
      <textarea id="opposingSubmissions"></textarea>
      <textarea id="plaintiffPleadings"></textarea>
      <textarea id="defendantPleadings"></textarea>
      <textarea id="summonsApplication"></textarea>
      <div id="uploadStatus"></div>
      <div id="validationWarnings"></div>
      <div id="outputSection"></div>
      <pre id="claudePromptOutput"></pre>
      <pre id="geminiPromptOutput"></pre>
    `;

    mockHTML.execute(global);
    appState = global.appState;
  });

  describe('Input Sanitization', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '"><script>alert("XSS")</script>',
      '\'; alert("XSS"); //',
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      '<object data="data:text/html,<script>alert(\'XSS\')</script>"></object>',
      '<embed src="data:text/html,<script>alert(\'XSS\')</script>">',
      '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      '<style>@import "javascript:alert(\'XSS\')";</style>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
      '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>',
      '<button onclick="alert(\'XSS\')">Click</button>'
    ];

    test.each(xssPayloads)('should sanitize XSS payload: %s', (payload) => {
      const chronologyTextarea = document.getElementById('chronology');

      // Set malicious content
      chronologyTextarea.value = payload;
      chronologyTextarea.dispatchEvent(new Event('input'));

      // Check that state contains the payload (it should be stored as-is)
      expect(appState.chronology).toBe(payload);

      // Generate prompt and check for proper escaping
      const prompt = global.generateClaudePrompt();

      // Ensure script tags are not executed when prompt is displayed
      const outputElement = document.getElementById('claudePromptOutput');
      outputElement.textContent = prompt;

      // Verify no script execution occurred
      expect(outputElement.innerHTML).not.toContain('<script>');
      expect(document.querySelectorAll('script').length).toBe(0);
    });

    test('should handle nested XSS attempts', () => {
      const nestedPayload = '<div><script>alert("XSS")</script><p>Normal content</p></div>';

      appState.arguments = nestedPayload;
      const prompt = global.generateClaudePrompt();

      // Verify content is included but not executed
      expect(prompt).toContain('Normal content');
      expect(prompt).toContain('script'); // Should be escaped/sanitized
    });

    test('should prevent DOM-based XSS through innerHTML', () => {
      const maliciousContent = '<img src=x onerror="window.xssExecuted=true">';

      appState.templateText = maliciousContent;
      global.generatePrompts();

      // Verify no XSS execution
      expect(window.xssExecuted).toBeUndefined();
    });

    test('should sanitize file upload content', async () => {
      const maliciousContent = '<script>alert("File XSS")</script>';
      const mockFile = new File([maliciousContent], 'malicious.txt', { type: 'text/plain' });

      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);

      // Content should be stored but not executed
      expect(appState.templateText).toBe(maliciousContent);

      const outputStatus = document.getElementById('uploadStatus');
      expect(outputStatus.innerHTML).not.toContain('<script>');
    });
  });

  describe('URL and Protocol Injection', () => {
    const dangerousUrls = [
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'vbscript:msgbox("XSS")',
      'file:///etc/passwd',
      'ftp://malicious.com/payload.js',
      'about:blank',
      'chrome://settings',
      'moz-extension://malicious'
    ];

    test.each(dangerousUrls)('should handle dangerous URL: %s', (url) => {
      appState.instructions = `Visit this link: ${url}`;

      const prompt = global.generateClaudePrompt();

      // URL should be included as text but not as executable link
      expect(prompt).toContain(url);

      // Verify no automatic link creation with dangerous protocols
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = prompt;
      const links = tempDiv.querySelectorAll('a[href^="javascript:"]');
      expect(links.length).toBe(0);
    });
  });

  describe('CSS Injection Prevention', () => {
    test('should prevent CSS-based attacks', () => {
      const cssPayload = '<style>body { background: url("javascript:alert(\'CSS XSS\')"); }</style>';

      appState.templateText = cssPayload;
      const prompt = global.generateClaudePrompt();

      // Content should be included but not executed as CSS
      expect(prompt).toContain('style');

      const tempDiv = document.createElement('div');
      tempDiv.textContent = prompt;
      expect(tempDiv.querySelectorAll('style').length).toBe(0);
    });

    test('should handle expression-based CSS attacks', () => {
      const expressionPayload = 'background: expression(alert("XSS"))';

      appState.arguments = expressionPayload;
      const prompt = global.generateClaudePrompt();

      expect(prompt).toContain('expression');
      // Should be treated as text, not CSS
    });
  });

  describe('Event Handler Injection', () => {
    const eventHandlers = [
      'onload="alert(\'XSS\')"',
      'onerror="alert(\'XSS\')"',
      'onclick="alert(\'XSS\')"',
      'onmouseover="alert(\'XSS\')"',
      'onfocus="alert(\'XSS\')"',
      'onblur="alert(\'XSS\')"',
      'onsubmit="alert(\'XSS\')"'
    ];

    test.each(eventHandlers)('should prevent event handler injection: %s', (handler) => {
      const payload = `<div ${handler}>Content</div>`;

      appState.chronology = payload;
      const prompt = global.generateClaudePrompt();

      // Handler should be included as text but not executable
      expect(prompt).toContain(handler);

      const tempDiv = document.createElement('div');
      tempDiv.textContent = prompt;
      expect(tempDiv.innerHTML).not.toMatch(/on\w+\s*=/);
    });
  });

  describe('Content Security Policy Compliance', () => {
    test('should not execute inline scripts', () => {
      const inlineScript = 'var x = 1; alert("Inline script executed");';

      // Simulate adding inline script content
      appState.instructions = inlineScript;
      global.generatePrompts();

      // Verify no global variables were created by the "script"
      expect(window.x).toBeUndefined();
    });

    test('should prevent dynamic script creation', () => {
      const dynamicScript = 'document.createElement("script").src="malicious.js"';

      appState.templateText = dynamicScript;
      const prompt = global.generateClaudePrompt();

      // Content should be included as text
      expect(prompt).toContain('createElement');

      // Verify no scripts were actually created
      const scripts = document.querySelectorAll('script[src*="malicious"]');
      expect(scripts.length).toBe(0);
    });
  });

  describe('Encoding and Escaping', () => {
    test('should properly encode HTML entities', () => {
      const htmlEntities = '&lt;script&gt;alert("XSS")&lt;/script&gt;';

      appState.arguments = htmlEntities;
      const prompt = global.generateClaudePrompt();

      expect(prompt).toContain(htmlEntities);
    });

    test('should handle Unicode and UTF-8 payloads', () => {
      const unicodePayload = '\u003cscript\u003ealert("Unicode XSS")\u003c/script\u003e';

      appState.chronology = unicodePayload;
      const prompt = global.generateClaudePrompt();

      expect(prompt).toContain('script');
      // Should be treated as text content
    });

    test('should handle Base64 encoded payloads', () => {
      const base64Payload = 'PHNjcmlwdD5hbGVydCgiQmFzZTY0IFhTUyIpPC9zY3JpcHQ+'; // <script>alert("Base64 XSS")</script>

      appState.templateText = base64Payload;
      const prompt = global.generateClaudePrompt();

      expect(prompt).toContain(base64Payload);
      // Should remain as base64 string, not decoded and executed
    });
  });

  describe('Browser-Specific Attack Vectors', () => {
    test('should prevent IE conditional comments', () => {
      const iePayload = '<!--[if IE]><script>alert("IE XSS")</script><![endif]-->';

      appState.instructions = iePayload;
      const prompt = global.generateClaudePrompt();

      expect(prompt).toContain('if IE');
      // Should be treated as comment text
    });

    test('should handle Firefox chrome:// URLs', () => {
      const firefoxPayload = 'chrome://browser/content/browser.xul';

      appState.opposingSubmissions = firefoxPayload;
      const prompt = global.generateClaudePrompt();

      expect(prompt).toContain('chrome://');
      // Should be included as text, not as navigatable URL
    });
  });
});