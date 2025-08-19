/**
 * Accessibility E2E Tests
 * Tests WCAG compliance and accessibility features
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper document structure and landmarks', async ({ page }) => {
    // Check for semantic HTML structure
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Verify main heading exists
    await expect(page.locator('h1')).toContainText('Submissions Synthesizer');

    // Check for navigation landmarks
    const nav = await page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('should have proper form labels and associations', async ({ page }) => {
    // Check that all form inputs have labels
    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      if (inputId) {
        // Check for explicit label
        const label = page.locator(`label[for="${inputId}"]`);
        if (await label.count() === 0) {
          // Check for aria-label or aria-labelledby
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');
          expect(ariaLabel || ariaLabelledby).toBeTruthy();
        } else {
          await expect(label).toBeVisible();
        }
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation through interactive elements
    const interactiveSelectors = [
      'input[type="radio"]',
      'textarea',
      'button',
      '.template-tab',
      'input[type="checkbox"]'
    ];

    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop

    // Start from the first interactive element
    await page.keyboard.press('Tab');
    tabCount++;

    // Navigate through elements
    while (tabCount < maxTabs) {
      const focusedElement = await page.locator(':focus').first();

      if (await focusedElement.count() === 0) {
        break;
      }

      // Verify focused element is interactive
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      const role = await focusedElement.getAttribute('role');
      const tabIndex = await focusedElement.getAttribute('tabindex');

      const isInteractive = ['input', 'textarea', 'button', 'select', 'a'].includes(tagName) ||
                           ['button', 'tab', 'link'].includes(role) ||
                           tabIndex === '0';

      expect(isInteractive).toBeTruthy();

      await page.keyboard.press('Tab');
      tabCount++;
    }

    expect(tabCount).toBeGreaterThan(5); // Should have navigated through multiple elements
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Test focus indicators on various elements
    const focusableElements = [
      '#chronology',
      '#arguments',
      '#generateBtn',
      'input[name="platform"]',
      '.template-tab'
    ];

    for (const selector of focusableElements) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.focus();

        // Check that focus is visible (element should have focus styles)
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // Verify the focused element is the one we expect
        const isFocused = await element.evaluate(el => el === document.activeElement);
        expect(isFocused).toBeTruthy();
      }
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').all();
    expect(liveRegions.length).toBeGreaterThan(0);

    // Test status announcements
    await page.fill('#chronology', 'Test content');

    // Check that status updates are announced
    const statusElements = await page.locator('[aria-live="polite"], [aria-live="assertive"]').all();
    expect(statusElements.length).toBeGreaterThan(0);

    // Test error announcements
    await page.click('#generateBtn'); // Generate without required fields

    const validationWarnings = page.locator('#validationWarnings');
    if (await validationWarnings.count() > 0) {
      const ariaLive = await validationWarnings.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    }
  });

  test('should have accessible button states and interactions', async ({ page }) => {
    // Test generate button accessibility
    const generateBtn = page.locator('#generateBtn');

    // Check initial state
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeEnabled();

    // Check button has accessible name
    const btnText = await generateBtn.textContent();
    const ariaLabel = await generateBtn.getAttribute('aria-label');
    expect(btnText || ariaLabel).toBeTruthy();

    // Test button activation with keyboard
    await generateBtn.focus();
    await page.keyboard.press('Enter');

    // Button should respond to Enter key
    // (We expect validation warnings since form is empty)

    // Test Space key activation
    await generateBtn.focus();
    await page.keyboard.press('Space');

    // Test radio button accessibility
    const radioButtons = await page.locator('input[type="radio"]').all();
    for (const radio of radioButtons) {
      await radio.focus();

      // Test arrow key navigation for radio groups
      await page.keyboard.press('ArrowDown');

      // Check that radio group navigation works
      const newFocused = page.locator(':focus');
      const newFocusedType = await newFocused.getAttribute('type');
      expect(newFocusedType).toBe('radio');
    }
  });

  test('should handle file upload accessibility', async ({ page }) => {
    // Navigate to upload tab
    await page.click('.template-tab[data-tab="upload"]');

    const fileInput = page.locator('#templateFile');

    // Check file input is accessible
    await expect(fileInput).toBeVisible();

    // Check for associated label or description
    const fileInputId = await fileInput.getAttribute('id');
    const label = page.locator(`label[for="${fileInputId}"]`);
    const ariaLabel = await fileInput.getAttribute('aria-label');
    const ariaDescribedby = await fileInput.getAttribute('aria-describedby');

    expect(await label.count() > 0 || ariaLabel || ariaDescribedby).toBeTruthy();

    // Test keyboard access to file input
    await fileInput.focus();
    await page.keyboard.press('Enter');

    // File picker should be accessible via keyboard
  });

  test('should have proper color contrast', async ({ page }) => {
    // This is a basic check - full contrast testing would need specialized tools

    // Check that text elements have sufficient contrast
    const textElements = await page.locator('p, span, label, button, h1, h2, h3').all();

    for (const element of textElements.slice(0, 10)) { // Test first 10 elements
      if (await element.isVisible()) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Basic check - ensure colors are not identical
        expect(styles.color).not.toBe(styles.backgroundColor);

        // Ensure text isn't too small
        const fontSize = parseFloat(styles.fontSize);
        expect(fontSize).toBeGreaterThan(10);
      }
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ forcedColors: 'active' });

    // Verify elements are still visible and functional
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#generateBtn')).toBeVisible();
    await expect(page.locator('#chronology')).toBeVisible();

    // Test that interactive elements still work
    await page.fill('#chronology', 'High contrast test');
    await expect(page.locator('#chronology')).toHaveValue('High contrast test');

    // Reset media emulation
    await page.emulateMedia({ forcedColors: null });
  });

  test('should work with screen reader simulation', async ({ page }) => {
    // Simulate screen reader behavior by testing with tab navigation only

    // Navigate through form using only keyboard
    await page.keyboard.press('Tab'); // First focusable element

    // Fill chronology using keyboard only
    const chronologyField = page.locator(':focus');
    await chronologyField.type('Screen reader test chronology');

    // Navigate to next field
    await page.keyboard.press('Tab');

    // Continue navigation
    let tabCount = 0;
    while (tabCount < 15) {
      const focusedElement = page.locator(':focus');

      // Check that focused element has accessible name
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());

      if (['input', 'textarea', 'button'].includes(tagName)) {
        const accessibleName = await focusedElement.evaluate(el => {
          return el.getAttribute('aria-label') ||
                 el.getAttribute('aria-labelledby') ||
                 (el.labels && el.labels[0]?.textContent) ||
                 el.textContent ||
                 el.getAttribute('placeholder');
        });

        expect(accessibleName?.trim()).toBeTruthy();
      }

      await page.keyboard.press('Tab');
      tabCount++;
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Fill required fields
    await page.fill('#chronology', 'Test chronology');
    await page.fill('#arguments', 'Test arguments');
    await page.fill('#templateText', 'Test template');

    // Generate prompts
    await page.click('#generateBtn');

    // Wait for output to appear
    await expect(page.locator('#outputSection')).toBeVisible();

    // Check that output has proper accessibility attributes
    const outputSection = page.locator('#outputSection');
    const ariaLive = await outputSection.getAttribute('aria-live');
    const role = await outputSection.getAttribute('role');

    // Output should be announced to screen readers
    expect(ariaLive || role).toBeTruthy();

    // Test tab switching announcements
    await page.click('.output-tab[data-output="gemini"]');

    // Tab change should be accessible
    const activeTab = page.locator('.output-tab.active');
    const tabRole = await activeTab.getAttribute('role');
    const ariaSelected = await activeTab.getAttribute('aria-selected');

    expect(tabRole).toBe('tab');
    expect(ariaSelected).toBe('true');
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Simulate user preference for reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Test that animations are reduced/disabled
    await page.click('.template-tab[data-tab="upload"]');
    await page.click('.template-tab[data-tab="paste"]');

    // Verify tab switching still works without animation
    await expect(page.locator('#pasteContent')).toBeVisible();
    await expect(page.locator('#uploadContent')).toBeHidden();

    // Reset media emulation
    await page.emulateMedia({ reducedMotion: null });
  });

  test('should be usable with voice control', async ({ page }) => {
    // Simulate voice control by using element identification

    // Voice control users rely on visible text and accessible names
    const voiceCommands = [
      { command: 'click chronology', selector: '#chronology' },
      { command: 'click arguments', selector: '#arguments' },
      { command: 'click generate', selector: '#generateBtn' },
      { command: 'click upload', selector: '.template-tab[data-tab="upload"]' }
    ];

    for (const cmd of voiceCommands) {
      const element = page.locator(cmd.selector);
      if (await element.count() > 0) {
        // Element should have visible text or accessible name
        const visibleText = await element.textContent();
        const ariaLabel = await element.getAttribute('aria-label');
        const title = await element.getAttribute('title');

        const hasAccessibleName = (visibleText && visibleText.trim()) || ariaLabel || title;
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('should support touch accessibility', async ({ page }) => {
    // Simulate touch device
    await page.setViewportSize({ width: 768, height: 1024 });

    // Test touch targets are large enough (minimum 44px)
    const touchTargets = await page.locator('button, input[type="radio"], .template-tab').all();

    for (const target of touchTargets.slice(0, 10)) { // Test first 10
      if (await target.isVisible()) {
        const boundingBox = await target.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThan(40);
          expect(boundingBox.height).toBeGreaterThan(40);
        }
      }
    }

    // Test that elements are not too close together
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length - 1, 5); i++) {
      const button1 = buttons[i];
      const button2 = buttons[i + 1];

      const box1 = await button1.boundingBox();
      const box2 = await button2.boundingBox();

      if (box1 && box2) {
        const distance = Math.sqrt(
          Math.pow(box2.x - box1.x, 2) + Math.pow(box2.y - box1.y, 2)
        );

        // Buttons should be reasonably spaced
        expect(distance).toBeGreaterThan(8);
      }
    }
  });

  test('should provide error messages accessibly', async ({ page }) => {
    // Trigger validation errors by trying to generate without required fields
    await page.click('#generateBtn');

    // Check that error messages are accessible
    const validationWarnings = page.locator('#validationWarnings');
    if (await validationWarnings.count() > 0) {
      // Error container should be announced
      const ariaLive = await validationWarnings.getAttribute('aria-live');
      const role = await validationWarnings.getAttribute('role');

      expect(ariaLive || role).toBeTruthy();

      // Individual error messages should be readable
      const errorMessages = await validationWarnings.locator('*').all();
      for (const error of errorMessages) {
        const text = await error.textContent();
        expect(text?.trim()).toBeTruthy();
      }
    }
  });
});