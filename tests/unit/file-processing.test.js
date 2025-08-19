/**
 * File Processing Unit Tests
 * Tests file upload, PDF extraction, and Word document processing
 */

describe('File Processing', () => {
  let mockHTML;
  let appState;

  beforeEach(() => {
    mockHTML = require('../../index.html');
    
    document.body.innerHTML = `
      <input type="file" id="templateFile">
      <div id="uploadStatus"></div>
      <textarea id="templateText"></textarea>
      <div class="template-tab" data-tab="upload"></div>
      <div class="template-tab" data-tab="paste"></div>
    `;

    mockHTML.execute(global);
    appState = global.appState;
  });

  describe('File Upload Handling', () => {
    test('should handle text file upload', async () => {
      const textContent = 'This is a test document content';
      const mockFile = new File([textContent], 'test.txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(appState.templateText).toBe(textContent);
    });

    test('should handle PDF file upload', async () => {
      const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      expect(pdfjsLib.getDocument).toHaveBeenCalled();
      expect(appState.templateText).toBe('Mock PDF content');
    });

    test('should handle Word document upload', async () => {
      const mockFile = new File(['docx content'], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      expect(mammoth.extractRawText).toHaveBeenCalled();
      expect(appState.templateText).toBe('Mock Word document content');
    });

    test('should reject unsupported file types', async () => {
      const mockFile = new File(['content'], 'test.exe', { type: 'application/exe' });
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Unsupported file type');
    });

    test('should handle file size limits', async () => {
      const largeContent = 'x'.repeat(50000000); // 50MB
      const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('too large');
    });

    test('should handle multiple files (take first)', async () => {
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [file1, file2] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      expect(appState.templateText).toBe('content1');
    });
  });

  describe('Drag and Drop Handling', () => {
    test('should handle drag over event', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { dropEffect: '' }
      };

      global.handleDragOver(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('copy');
    });

    test('should handle file drop event', async () => {
      const mockFile = new File(['dropped content'], 'dropped.txt', { type: 'text/plain' });
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [mockFile] }
      };

      await global.handleFileDrop(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(appState.templateText).toBe('dropped content');
    });
  });

  describe('File Processing Edge Cases', () => {
    test('should handle empty files', async () => {
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

    test('should handle corrupted PDF files', async () => {
      const corruptedFile = new File(['corrupted'], 'corrupt.pdf', { type: 'application/pdf' });
      
      // Mock PDF.js to reject
      pdfjsLib.getDocument.mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF'))
      });
      
      const mockEvent = {
        target: { files: [corruptedFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Error');
    });

    test('should handle corrupted Word documents', async () => {
      const corruptedFile = new File(['corrupted'], 'corrupt.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Mock Mammoth to reject
      mammoth.extractRawText.mockReturnValue(Promise.reject(new Error('Invalid DOCX')));
      
      const mockEvent = {
        target: { files: [corruptedFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      const uploadStatus = document.getElementById('uploadStatus');
      expect(uploadStatus.textContent).toContain('Error');
    });

    test('should handle files with no extension', async () => {
      const noExtFile = new File(['content'], 'noextension', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [noExtFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      expect(appState.templateText).toBe('content');
    });

    test('should handle files with special characters in name', async () => {
      const specialFile = new File(['content'], 'test@#$%^&*().txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [specialFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      await global.handleFileUpload(mockEvent);
      
      expect(appState.templateText).toBe('content');
    });
  });

  describe('File Processing Performance', () => {
    test('should process files within reasonable time', async () => {
      const content = 'x'.repeat(1000000); // 1MB
      const mockFile = new File([content], 'large.txt', { type: 'text/plain' });
      
      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      const startTime = performance.now();
      await global.handleFileUpload(mockEvent);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should handle concurrent file uploads', async () => {
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });
      
      const event1 = {
        target: { files: [file1] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      const event2 = {
        target: { files: [file2] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      // Simulate concurrent uploads
      const promises = [
        global.handleFileUpload(event1),
        global.handleFileUpload(event2)
      ];

      await Promise.all(promises);
      
      // Should handle gracefully without errors
      expect(appState.templateText).toBeDefined();
    });
  });
});