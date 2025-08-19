/**
 * Performance E2E Tests
 * Tests real-world performance metrics in browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load page within performance budget', async ({ page }) => {
    // Measure page load performance
    const loadMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });

    // Performance budgets
    expect(loadMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(loadMetrics.loadComplete).toBeLessThan(3000); // 3 seconds
    if (loadMetrics.firstPaint) {
      expect(loadMetrics.firstPaint).toBeLessThan(1500); // 1.5 seconds
    }
    if (loadMetrics.firstContentfulPaint) {
      expect(loadMetrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
    }
  });

  test('should handle large text input efficiently', async ({ page }) => {
    // Create large text content
    const largeText = 'A'.repeat(100000); // 100KB

    const startTime = Date.now();
    
    // Fill chronology with large text
    await page.fill('#chronology', largeText);
    
    // Wait for character counter to update
    await expect(page.locator('#chronologyCounter')).toContainText('100000');
    
    const endTime = Date.now();
    const inputTime = endTime - startTime;
    
    // Large text input should complete within 2 seconds
    expect(inputTime).toBeLessThan(2000);
  });

  test('should generate prompts quickly', async ({ page }) => {
    // Fill required fields with substantial content
    await page.fill('#chronology', 'This is a detailed chronology of events that occurred over several months. '.repeat(20));
    await page.fill('#arguments', 'These are complex legal arguments with multiple points and sub-arguments. '.repeat(20));
    await page.fill('#templateText', 'This is a comprehensive template document with detailed formatting. '.repeat(50));

    const startTime = Date.now();
    
    // Generate prompts
    await page.click('#generateBtn');
    
    // Wait for output to appear
    await expect(page.locator('#outputSection')).toBeVisible();
    await expect(page.locator('#claudePromptOutput')).not.toBeEmpty();
    
    const endTime = Date.now();
    const generationTime = endTime - startTime;
    
    // Prompt generation should complete within 3 seconds
    expect(generationTime).toBeLessThan(3000);
  });

  test('should handle file upload efficiently', async ({ page }) => {
    // Switch to upload tab
    await page.click('.template-tab[data-tab="upload"]');
    
    // Create a reasonably large file
    const fileContent = 'This is a legal document with substantial content. '.repeat(1000); // ~50KB
    
    const startTime = Date.now();
    
    await page.setInputFiles('#templateFile', {
      name: 'large-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });
    
    // Wait for upload completion
    await expect(page.locator('#uploadStatus')).toContainText('successfully');
    
    const endTime = Date.now();
    const uploadTime = endTime - startTime;
    
    // File upload should complete within 2 seconds
    expect(uploadTime).toBeLessThan(2000);
  });

  test('should maintain responsiveness during rapid interactions', async ({ page }) => {
    const interactions = 20;
    const startTime = Date.now();
    
    // Perform rapid interactions
    for (let i = 0; i < interactions; i++) {
      await page.fill('#chronology', `Rapid update ${i}`);
      
      if (i % 5 === 0) {
        // Switch tabs occasionally
        await page.click('.template-tab[data-tab="upload"]');
        await page.click('.template-tab[data-tab="paste"]');
      }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / interactions;
    
    // Each interaction should average less than 100ms
    expect(averageTime).toBeLessThan(100);
  });

  test('should handle session save/load efficiently', async ({ page }) => {
    // Fill form with substantial data
    await page.fill('#chronology', 'Large chronology content. '.repeat(500));
    await page.fill('#arguments', 'Complex arguments. '.repeat(500));
    await page.fill('#templateText', 'Detailed template. '.repeat(1000));
    
    const saveStartTime = Date.now();
    
    // Save session
    await page.click('#saveSession');
    
    const saveEndTime = Date.now();
    const saveTime = saveEndTime - saveStartTime;
    
    // Clear form
    await page.click('#clearAll');
    await expect(page.locator('#chronology')).toHaveValue('');
    
    const loadStartTime = Date.now();
    
    // Load session
    await page.click('#loadSession');
    
    // Wait for data to be restored
    await expect(page.locator('#chronology')).not.toHaveValue('');
    
    const loadEndTime = Date.now();
    const loadTime = loadEndTime - loadStartTime;
    
    // Session operations should be fast
    expect(saveTime).toBeLessThan(1000); // 1 second
    expect(loadTime).toBeLessThan(1500); // 1.5 seconds
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // First Input Delay (simulate user interaction)
        document.addEventListener('click', function onFirstClick() {
          vitals.fid = performance.now();
          document.removeEventListener('click', onFirstClick);
        });
        
        // Cumulative Layout Shift
        let cumulativeLayoutShift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value;
            }
          }
          vitals.cls = cumulativeLayoutShift;
        }).observe({ type: 'layout-shift', buffered: true });
        
        // Return measurements after a delay
        setTimeout(() => resolve(vitals), 2000);
      });
    });
    
    // Core Web Vitals thresholds
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500); // Good LCP < 2.5s
    }
    if (vitals.cls) {
      expect(vitals.cls).toBeLessThan(0.1); // Good CLS < 0.1
    }
  });

  test('should handle memory efficiently during extended use', async ({ page }) => {
    // Enable memory monitoring
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null;
    });
    
    // Simulate extended usage
    for (let session = 0; session < 5; session++) {
      // Fill form with data
      await page.fill('#chronology', `Session ${session} chronology. `.repeat(100));
      await page.fill('#arguments', `Session ${session} arguments. `.repeat(100));
      await page.fill('#templateText', `Session ${session} template. `.repeat(200));
      
      // Generate prompts
      await page.click('#generateBtn');
      await expect(page.locator('#outputSection')).toBeVisible();
      
      // Clear and repeat
      await page.click('#clearAll');
      
      // Brief pause
      await page.waitForTimeout(100);
    }
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null;
    });
    
    // Memory should not increase excessively
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.used - initialMemory.used;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    }
  });

  test('should render large outputs efficiently', async ({ page }) => {
    // Create very large input content
    const largeContent = 'This is a very long legal document section. '.repeat(2000); // ~100KB
    
    await page.fill('#chronology', largeContent);
    await page.fill('#arguments', largeContent);
    await page.fill('#templateText', largeContent);
    
    const renderStartTime = Date.now();
    
    // Generate prompts (will create large output)
    await page.click('#generateBtn');
    
    // Wait for output to be fully rendered
    await expect(page.locator('#claudePromptOutput')).not.toBeEmpty();
    
    const renderEndTime = Date.now();
    const renderTime = renderEndTime - renderStartTime;
    
    // Large output rendering should complete within 5 seconds
    expect(renderTime).toBeLessThan(5000);
    
    // Test scrolling performance
    const scrollStartTime = Date.now();
    
    await page.locator('#claudePromptOutput').scrollIntoView();
    await page.mouse.wheel(0, 1000); // Scroll down
    await page.mouse.wheel(0, -1000); // Scroll back up
    
    const scrollEndTime = Date.now();
    const scrollTime = scrollEndTime - scrollStartTime;
    
    // Scrolling should be smooth (less than 500ms)
    expect(scrollTime).toBeLessThan(500);
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    // Fill initial data
    await page.fill('#chronology', 'Base chronology');
    await page.fill('#arguments', 'Base arguments');
    await page.fill('#templateText', 'Base template');
    
    const startTime = Date.now();
    
    // Perform multiple concurrent operations
    const operations = [
      // Update text content
      page.fill('#instructions', 'New instructions'),
      
      // Switch tabs
      page.click('.template-tab[data-tab="upload"]'),
      
      // Generate prompts
      page.click('#generateBtn'),
      
      // Save session
      page.click('#saveSession')
    ];
    
    // Execute operations concurrently
    await Promise.all(operations.slice(0, 2)); // Non-conflicting operations first
    await Promise.all(operations.slice(2)); // Then the rest
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Concurrent operations should complete efficiently
    expect(totalTime).toBeLessThan(3000);
    
    // Verify all operations completed successfully
    await expect(page.locator('#outputSection')).toBeVisible();
    await expect(page.locator('.template-tab[data-tab="upload"]')).toHaveClass(/active/);
  });

  test('should maintain performance on slower devices', async ({ page }) => {
    // Simulate slower CPU
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x slower
    
    try {
      // Perform standard operations with throttling
      await page.fill('#chronology', 'Throttled test content. '.repeat(100));
      
      const startTime = Date.now();
      
      await page.click('#generateBtn');
      await expect(page.locator('#outputSection')).toBeVisible();
      
      const endTime = Date.now();
      const throttledTime = endTime - startTime;
      
      // Should still complete within reasonable time even when throttled
      expect(throttledTime).toBeLessThan(10000); // 10 seconds max
      
    } finally {
      // Remove throttling
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }
  });
});