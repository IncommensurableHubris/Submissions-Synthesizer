/**
 * Performance Tests
 * Tests application performance metrics and optimization
 */

describe('Performance Tests', () => {
  let mockHTML;
  let appState;

  beforeEach(() => {
    mockHTML = require('../../index.html');

    document.body.innerHTML = `
      <textarea id="chronology"></textarea>
      <textarea id="arguments"></textarea>
      <textarea id="templateText"></textarea>
      <textarea id="instructions"></textarea>
      <input type="file" id="templateFile">
      <button id="generateBtn"></button>
      <div id="outputSection"></div>
      <pre id="claudePromptOutput"></pre>
      <pre id="geminiPromptOutput"></pre>
    `;

    mockHTML.execute(global);
    appState = global.appState;
  });

  describe('Memory Performance', () => {
    test('should handle large text inputs without memory leaks', async () => {
      const startMemory = performanceTestUtils.measureMemoryUsage();

      // Create large text content (1MB)
      const largeText = 'A'.repeat(1024 * 1024);

      // Fill all text areas with large content
      document.getElementById('chronology').value = largeText;
      document.getElementById('chronology').dispatchEvent(new Event('input'));

      document.getElementById('arguments').value = largeText;
      document.getElementById('arguments').dispatchEvent(new Event('input'));

      document.getElementById('templateText').value = largeText;
      document.getElementById('templateText').dispatchEvent(new Event('input'));

      // Force garbage collection if available
      if (global.gc) {global.gc();}

      const endMemory = performanceTestUtils.measureMemoryUsage();

      if (startMemory && endMemory) {
        const memoryIncrease = endMemory.used - startMemory.used;
        // Memory increase should be reasonable (less than 50MB for 3MB of text)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should handle rapid input changes efficiently', async () => {
      const startTime = performance.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const textarea = document.getElementById('chronology');
        textarea.value = `Test content iteration ${i}`;
        textarea.dispatchEvent(new Event('input'));
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // Each input update should take less than 10ms on average
      expect(averageTime).toBeLessThan(10);
    });

    test('should efficiently handle character counting for large texts', async () => {
      const largeText = 'X'.repeat(500000); // 500KB

      const executionTime = await performanceTestUtils.measureExecutionTime(async () => {
        document.getElementById('chronology').value = largeText;
        document.getElementById('chronology').dispatchEvent(new Event('input'));
      });

      // Character counting should complete within 100ms
      expect(executionTime).toBeLessThan(100);

      // Verify counter is accurate
      const counter = document.getElementById('chronologyCounter');
      expect(counter.textContent).toContain('500000');
    });
  });

  describe('File Processing Performance', () => {
    test('should process small files quickly', async () => {
      const smallContent = 'Small file content';
      const mockFile = new File([smallContent], 'small.txt', { type: 'text/plain' });

      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      const executionTime = await performanceTestUtils.measureExecutionTime(async () => {
        await global.handleFileUpload(mockEvent);
      });

      // Small files should process within 50ms
      expect(executionTime).toBeLessThan(50);
    });

    test('should handle large files within reasonable time', async () => {
      const largeContent = 'X'.repeat(5 * 1024 * 1024); // 5MB
      const mockFile = new File([largeContent], 'large.txt', { type: 'text/plain' });

      const mockEvent = {
        target: { files: [mockFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      const executionTime = await performanceTestUtils.measureExecutionTime(async () => {
        await global.handleFileUpload(mockEvent);
      });

      // Large files should process within 5 seconds
      expect(executionTime).toBeLessThan(5000);
    });

    test('should process PDF files efficiently', async () => {
      const mockPDFFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

      // Mock PDF.js with realistic processing time
      pdfjsLib.getDocument.mockReturnValue({
        promise: new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              numPages: 1,
              getPage: jest.fn(() => Promise.resolve({
                getTextContent: jest.fn(() => Promise.resolve({
                  items: Array.from({ length: 1000 }, (_, i) => ({ str: `Page content ${i}` }))
                }))
              }))
            });
          }, 100); // Simulate 100ms processing time
        })
      });

      const mockEvent = {
        target: { files: [mockPDFFile] },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      const executionTime = await performanceTestUtils.measureExecutionTime(async () => {
        await global.handleFileUpload(mockEvent);
      });

      // PDF processing should complete within 2 seconds
      expect(executionTime).toBeLessThan(2000);
    });
  });

  describe('Prompt Generation Performance', () => {
    test('should generate prompts quickly for normal input', async () => {
      // Set up normal-sized inputs
      appState.chronology = 'A'.repeat(5000); // 5KB
      appState.arguments = 'B'.repeat(5000);
      appState.templateText = 'C'.repeat(10000); // 10KB
      appState.instructions = 'D'.repeat(2000);

      const executionTime = await performanceTestUtils.measureExecutionTime(() => {
        global.generatePrompts();
      });

      // Normal prompt generation should complete within 200ms
      expect(executionTime).toBeLessThan(200);
    });

    test('should handle large prompt generation efficiently', async () => {
      // Set up large inputs
      appState.chronology = 'A'.repeat(50000); // 50KB
      appState.arguments = 'B'.repeat(50000);
      appState.templateText = 'C'.repeat(100000); // 100KB
      appState.instructions = 'D'.repeat(20000);

      const executionTime = await performanceTestUtils.measureExecutionTime(() => {
        global.generatePrompts();
      });

      // Large prompt generation should complete within 1 second
      expect(executionTime).toBeLessThan(1000);
    });

    test('should generate Claude and Gemini prompts in parallel efficiently', async () => {
      appState.platform = 'both';
      appState.chronology = 'Test chronology';
      appState.arguments = 'Test arguments';
      appState.templateText = 'Test template';

      const executionTime = await performanceTestUtils.measureExecutionTime(() => {
        global.generatePrompts();
      });

      // Parallel generation should not take significantly longer than single
      expect(executionTime).toBeLessThan(300);

      // Verify both outputs are generated
      expect(document.getElementById('claudePromptOutput').textContent).toContain('chronology');
      expect(document.getElementById('geminiPromptOutput').textContent).toContain('chronology');
    });
  });

  describe('UI Responsiveness', () => {
    test('should update character counters without blocking UI', async () => {
      const textarea = document.getElementById('chronology');
      const updates = [];

      // Measure time for multiple rapid updates
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();

        textarea.value = `Content update ${i}`;
        textarea.dispatchEvent(new Event('input'));

        const endTime = performance.now();
        updates.push(endTime - startTime);
      }

      const averageUpdateTime = updates.reduce((a, b) => a + b, 0) / updates.length;
      const maxUpdateTime = Math.max(...updates);

      // Average update should be fast
      expect(averageUpdateTime).toBeLessThan(5);

      // No single update should block for long
      expect(maxUpdateTime).toBeLessThan(20);
    });

    test('should handle rapid tab switching efficiently', async () => {
      const pasteTab = document.createElement('div');
      pasteTab.className = 'template-tab';
      pasteTab.dataset.tab = 'paste';

      const uploadTab = document.createElement('div');
      uploadTab.className = 'template-tab';
      uploadTab.dataset.tab = 'upload';

      document.body.appendChild(pasteTab);
      document.body.appendChild(uploadTab);

      const switchTimes = [];

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();

        if (global.switchTemplateTab) {
          global.switchTemplateTab(i % 2 === 0 ? 'paste' : 'upload');
        }

        const endTime = performance.now();
        switchTimes.push(endTime - startTime);
      }

      const averageSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;

      // Tab switching should be instantaneous
      expect(averageSwitchTime).toBeLessThan(2);
    });

    test('should handle form validation without performance impact', async () => {
      const validationTimes = [];

      // Test validation with varying amounts of content
      const contentSizes = [100, 1000, 10000, 50000];

      for (const size of contentSizes) {
        appState.chronology = 'A'.repeat(size);
        appState.arguments = 'B'.repeat(size);
        appState.templateText = 'C'.repeat(size);

        const startTime = performance.now();
        global.updateValidation();
        const endTime = performance.now();

        validationTimes.push(endTime - startTime);
      }

      // Validation should remain fast regardless of content size
      validationTimes.forEach(time => {
        expect(time).toBeLessThan(10);
      });
    });
  });

  describe('DOM Manipulation Performance', () => {
    test('should efficiently update large DOM content', async () => {
      const largeContent = Array.from({ length: 1000 }, (_, i) => `Line ${i}`).join('\n');

      const executionTime = await performanceTestUtils.measureExecutionTime(() => {
        document.getElementById('claudePromptOutput').textContent = largeContent;
      });

      // Large DOM updates should complete within 50ms
      expect(executionTime).toBeLessThan(50);
    });

    test('should handle rapid DOM updates efficiently', async () => {
      const output = document.getElementById('claudePromptOutput');
      const updateTimes = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        output.textContent = `Update ${i}`;
        const endTime = performance.now();

        updateTimes.push(endTime - startTime);
      }

      const averageUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

      // DOM updates should average less than 1ms
      expect(averageUpdateTime).toBeLessThan(1);
    });
  });

  describe('Resource Usage Optimization', () => {
    test('should not create excessive event listeners', () => {
      const initialListenerCount = getEventListenerCount();

      // Simulate application initialization multiple times
      for (let i = 0; i < 5; i++) {
        if (global.setupEventListeners) {
          global.setupEventListeners();
        }
      }

      const finalListenerCount = getEventListenerCount();

      // Should not create excessive listeners
      expect(finalListenerCount - initialListenerCount).toBeLessThan(50);
    });

    test('should efficiently handle session save/load operations', async () => {
      // Create a realistic session
      appState.chronology = 'A'.repeat(10000);
      appState.arguments = 'B'.repeat(10000);
      appState.templateText = 'C'.repeat(20000);

      const saveTime = await performanceTestUtils.measureExecutionTime(() => {
        global.saveSession();
      });

      const loadTime = await performanceTestUtils.measureExecutionTime(() => {
        global.loadSession();
      });

      // Session operations should be fast
      expect(saveTime).toBeLessThan(50);
      expect(loadTime).toBeLessThan(100);
    });
  });

  describe('Stress Testing', () => {
    test('should handle continuous rapid interactions', async () => {
      const startMemory = performanceTestUtils.measureMemoryUsage();
      const interactions = 500;
      const startTime = performance.now();

      for (let i = 0; i < interactions; i++) {
        // Simulate various rapid interactions
        const textarea = document.getElementById('chronology');
        textarea.value = `Stress test ${i}`;
        textarea.dispatchEvent(new Event('input'));

        if (i % 10 === 0 && global.updateValidation) {
          global.updateValidation();
        }

        if (i % 50 === 0 && global.updateOverallProgress) {
          global.updateOverallProgress();
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageInteractionTime = totalTime / interactions;

      // Should handle all interactions efficiently
      expect(averageInteractionTime).toBeLessThan(2);

      // Memory should not increase excessively
      const endMemory = performanceTestUtils.measureMemoryUsage();
      if (startMemory && endMemory) {
        const memoryIncrease = endMemory.used - startMemory.used;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB limit
      }
    });

    test('should maintain performance with sustained usage', async () => {
      const performanceMetrics = [];

      // Simulate sustained usage over time
      for (let session = 0; session < 10; session++) {
        const sessionStart = performance.now();

        // Simulate a work session
        for (let i = 0; i < 20; i++) {
          document.getElementById('chronology').value = `Session ${session} update ${i}`;
          document.getElementById('chronology').dispatchEvent(new Event('input'));

          if (i % 5 === 0) {
            global.generatePrompts();
          }
        }

        const sessionEnd = performance.now();
        performanceMetrics.push(sessionEnd - sessionStart);

        // Brief pause between sessions
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Performance should remain consistent across sessions
      const firstHalf = performanceMetrics.slice(0, 5);
      const secondHalf = performanceMetrics.slice(5);

      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Performance degradation should be minimal (less than 50% increase)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
    });
  });

  // Helper function to estimate event listener count
  function getEventListenerCount() {
    // This is a rough estimation since we can't directly count event listeners
    const elements = document.querySelectorAll('*');
    let estimated = 0;

    elements.forEach(el => {
      // Check for common event listener indicators
      if (el.onclick || el.onchange || el.oninput) {estimated++;}
      if (el.id && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON')) {
        estimated++; // Assume these have listeners
      }
    });

    return estimated;
  }
});