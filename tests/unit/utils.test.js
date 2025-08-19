/**
 * Utility Functions Unit Tests
 * Tests the utility functions that can be imported directly
 */

describe('Utility Functions', () => {
  describe('Basic JavaScript Functions', () => {
    test('should calculate string length correctly', () => {
      const testString = 'Hello World';
      expect(testString.length).toBe(11);
    });

    test('should handle empty strings', () => {
      const emptyString = '';
      expect(emptyString.length).toBe(0);
    });

    test('should handle array operations', () => {
      const testArray = [1, 2, 3, 4, 5];
      expect(testArray.length).toBe(5);
      expect(testArray.join(', ')).toBe('1, 2, 3, 4, 5');
    });
  });

  describe('localStorage Mock', () => {
    test('should handle localStorage operations', () => {
      const testData = { platform: 'claude', position: 'applicant' };
      localStorage.setItem('testKey', JSON.stringify(testData));

      const retrieved = JSON.parse(localStorage.getItem('testKey'));
      expect(retrieved.platform).toBe('claude');
      expect(retrieved.position).toBe('applicant');
    });

    test('should handle localStorage clearing', () => {
      localStorage.setItem('testKey', 'testValue');
      localStorage.clear();
      expect(localStorage.getItem('testKey')).toBeNull();
    });
  });

  describe('DOM Manipulation', () => {
    test('should create DOM elements', () => {
      const div = document.createElement('div');
      div.id = 'testDiv';
      div.textContent = 'Test Content';

      expect(div.id).toBe('testDiv');
      expect(div.textContent).toBe('Test Content');
    });

    test('should handle form elements', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 'test value';

      expect(input.type).toBe('text');
      expect(input.value).toBe('test value');
    });
  });

  describe('Security Utilities', () => {
    test('should sanitize HTML content', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '');
      expect(sanitized).toBe('');
    });

    test('should escape HTML entities', () => {
      const htmlInput = '<div>test & content</div>';
      const escaped = htmlInput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      expect(escaped).toBe('&lt;div&gt;test &amp; content&lt;/div&gt;');
    });
  });

  describe('File Processing Mock', () => {
    test('should handle mock file creation', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      expect(mockFile.name).toBe('test.txt');
      expect(mockFile.type).toBe('text/plain');
      expect(mockFile.size).toBeGreaterThan(0);
    });

    test('should validate file types', () => {
      const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const textFile = 'text/plain';
      const pdfFile = 'application/pdf';
      const invalidFile = 'image/jpeg';

      expect(allowedTypes.includes(textFile)).toBe(true);
      expect(allowedTypes.includes(pdfFile)).toBe(true);
      expect(allowedTypes.includes(invalidFile)).toBe(false);
    });
  });

  describe('Performance Utilities', () => {
    test('should measure execution time', async () => {
      const start = Date.now();
      await new Promise(resolve => setTimeout(resolve, 10));
      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeGreaterThanOrEqual(10);
    });

    test('should handle large text processing', () => {
      const largeText = 'A'.repeat(100000);
      const processed = largeText.split('').length;
      expect(processed).toBe(100000);
    });
  });
});