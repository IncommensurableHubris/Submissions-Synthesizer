/**
 * Complete Workflow E2E Tests
 * Tests full user journeys from start to finish
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Submissions Synthesizer');
    
    // Wait for JavaScript to initialize and DOM to be ready
    await page.waitForTimeout(2000);
    
    // Ensure character counter elements are present
    await expect(page.locator('#chronologyCounter')).toBeVisible();
    await expect(page.locator('#argumentsCounter')).toBeVisible();
  });

  test('should complete full applicant workflow', async ({ page }) => {
    // Step 1: Verify initial state
    await expect(page.locator('input[name="platform"][value="claude"]')).toBeChecked();
    await expect(page.locator('input[name="position"][value="applicant"]')).toBeChecked();

    // Step 2: Fill chronology using type for natural events
    const chronologyText = 'January 1, 2024: Contract signed between parties\nFebruary 15, 2024: First payment due\nMarch 1, 2024: Payment not received\nMarch 15, 2024: Notice of breach sent';
    
    // Clear field first and use type to trigger natural input events
    await page.locator('#chronology').clear();
    await page.locator('#chronology').type(chronologyText, { delay: 10 });
    
    // Wait for character counter to update
    await page.waitForTimeout(500);

    // Verify character counter updates
    await expect(page.locator('#chronologyCounter')).toContainText(`${chronologyText.length} characters`);

    // Step 3: Fill arguments
    const argumentsText = 'Material breach of payment terms\nDamages in amount of $50,000\nInterest and attorney fees\nInjunctive relief to prevent further harm';
    await page.locator('#arguments').clear();
    await page.locator('#arguments').type(argumentsText, { delay: 10 });
    await page.waitForTimeout(300);

    // Step 4: Add template content
    const templateText = `MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE COURT:

Plaintiff respectfully moves this Court for summary judgment in its favor and against Defendant on all claims stated in the Complaint.

I. STATEMENT OF FACTS

The undisputed material facts establish that Defendant breached its contractual obligations...`;

    // Switch to paste tab to access templateText
    await page.click('.template-tab[data-tab="paste"]');
    await page.waitForTimeout(300);
    await expect(page.locator('#paste')).toBeVisible();
    await page.locator('#templateText').clear();
    await page.locator('#templateText').type(templateText, { delay: 5 });
    await page.waitForTimeout(300);

    // Step 5: Add instructions
    const instructionsText = 'Please ensure proper citation to Federal Rules\nUse formal court language\nInclude damages calculation table\nReference all supporting exhibits';
    await page.locator('#instructions').clear();
    await page.locator('#instructions').type(instructionsText, { delay: 10 });
    await page.waitForTimeout(300);

    // Step 6: Verify validation passes
    await page.waitForTimeout(500);
    await expect(page.locator('#validationWarnings')).toHaveCount(0);

    // Step 7: Generate prompts
    await page.click('#generateBtn');
    await page.waitForTimeout(1000);

    // Step 8: Verify output appears
    await expect(page.locator('#outputSection')).toBeVisible();
    await expect(page.locator('#claudePrompt')).toContainText(chronologyText.substring(0, 50));
    await expect(page.locator('#claudePrompt')).toContainText(argumentsText.substring(0, 30));
    await expect(page.locator('#claudePrompt')).toContainText('applicant');

    // Step 9: Test copy functionality
    await page.click('#copyClaude');
    await page.waitForTimeout(300);

    // Verify copy worked (check if button shows success state)
    await expect(page.locator('#copyClaude')).toContainText('Copied');
  });

  test('should complete full respondent workflow', async ({ page }) => {
    // Step 1: Switch to respondent position
    await page.click('input[name="position"][value="respondent"]');
    await expect(page.locator('input[name="position"][value="respondent"]')).toBeChecked();

    // Step 2: Verify UI adapts for respondent
    await expect(page.locator('#opposingSubmissionsGroup')).toBeVisible();

    // Step 3: Fill opposing submissions first
    const opposingText = 'Plaintiff alleges breach of contract\nSeeks $50,000 in damages\nClaims material harm from delayed payment\nRequests injunctive relief';
    await page.locator('#opposingSubmissions').clear();
    await page.locator('#opposingSubmissions').type(opposingText, { delay: 10 });
    await page.waitForTimeout(300);

    // Step 4: Fill defense chronology
    const defenseChronology = 'January 1, 2024: Contract signed with modified terms\nFebruary 10, 2024: Force majeure event occurred\nFebruary 20, 2024: Notice sent to plaintiff\nMarch 5, 2024: Attempted cure of any alleged breach';
    await page.locator('#chronology').clear();
    await page.locator('#chronology').type(defenseChronology, { delay: 10 });
    await page.waitForTimeout(300);

    // Step 5: Fill defense arguments
    const defenseArguments = 'No material breach occurred\nForce majeure excuses performance\nPlaintiff waived right to claim breach\nDamages are speculative and unproven\nInjunctive relief is inappropriate';
    await page.locator('#arguments').clear();
    await page.locator('#arguments').type(defenseArguments, { delay: 10 });
    await page.waitForTimeout(300);

    // Step 6: Add response template
    const responseTemplate = `RESPONSE TO MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE COURT:

Defendant respectfully opposes Plaintiff's Motion for Summary Judgment and requests that the Court deny the motion in its entirety.

I. STATEMENT OF DISPUTED FACTS

Contrary to Plaintiff's assertions, genuine issues of material fact preclude summary judgment...`;

    // Switch to paste tab to access templateText
    await page.click('.template-tab[data-tab="paste"]');
    await page.waitForTimeout(300);
    await expect(page.locator('#paste')).toBeVisible();
    await page.locator('#templateText').clear();
    await page.locator('#templateText').type(responseTemplate, { delay: 5 });
    await page.waitForTimeout(300);

    // Step 7: Generate prompts
    await page.click('#generateBtn');
    await page.waitForTimeout(1000);

    // Step 8: Verify respondent-specific content
    await expect(page.locator('#claudePrompt')).toContainText('respondent');
    await expect(page.locator('#claudePrompt')).toContainText('opposing');
    await expect(page.locator('#claudePrompt')).toContainText(opposingText.substring(0, 30));
  });

  test('should handle platform switching correctly', async ({ page }) => {
    // Fill basic required fields
    await page.locator('#chronology').type('Test chronology', { delay: 10 });
    await page.waitForTimeout(300);
    await page.locator('#arguments').type('Test arguments', { delay: 10 });
    await page.waitForTimeout(300);
    
    // Switch to paste tab to access templateText
    await page.click('.template-tab[data-tab="paste"]');
    await page.waitForTimeout(300);
    await page.locator('#templateText').type('Test template', { delay: 10 });
    await page.waitForTimeout(300);

    // Test Claude platform
    await page.click('input[name="platform"][value="claude"]');
    await page.click('#generateBtn');
    await page.waitForTimeout(1000);
    await expect(page.locator('#claudePrompt')).toContainText('Test chronology');

    // Switch to Gemini platform
    await page.click('input[name="platform"][value="gemini"]');
    await page.click('#generateBtn');
    await page.waitForTimeout(1000);
    await expect(page.locator('#geminiPrompt')).toContainText('Test chronology');

    // Switch to Both platforms
    await page.click('input[name="platform"][value="both"]');
    await page.click('#generateBtn');
    await page.waitForTimeout(1000);

    // Verify both outputs are generated
    await expect(page.locator('#claudePrompt')).toContainText('Test chronology');
    await expect(page.locator('#geminiPrompt')).toContainText('Test chronology');
  });

  test('should handle file upload workflow', async ({ page }) => {
    // Switch to upload tab
    await page.click('.template-tab[data-tab="upload"]');
    await expect(page.locator('#upload')).toBeVisible();
    await expect(page.locator('#paste')).toBeHidden();

    // Test file upload with a mock file
    const fileContent = `SAMPLE LEGAL BRIEF

I. INTRODUCTION

This brief demonstrates the expected format and style for legal submissions.

II. STATEMENT OF FACTS

The facts are as follows...

III. ARGUMENT

A. Legal Standard

The applicable legal standard is...`;

    // Create a file input and upload
    await page.setInputFiles('#templateFile', {
      name: 'sample-brief.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    });

    // Verify upload success
    await expect(page.locator('#uploadStatus')).toContainText('successfully');

    // Verify content is loaded
    await expect(page.locator('#templateText')).toHaveValue(fileContent);
  });

  test('should handle session save and load workflow', async ({ page }) => {
    // Fill out complete form data
    await page.click('input[name="platform"][value="gemini"]');
    await page.click('input[name="position"][value="respondent"]');

    const testData = {
      chronology: 'Saved session chronology data',
      arguments: 'Saved session arguments data',
      templateText: 'Saved session template data',
      instructions: 'Saved session instructions data',
      opposingSubmissions: 'Saved session opposing data'
    };

    await page.locator('#chronology').type(testData.chronology, { delay: 10 });
    await page.waitForTimeout(300);
    await page.locator('#arguments').type(testData.arguments, { delay: 10 });
    await page.waitForTimeout(300);
    
    // Switch to paste tab to access templateText
    await page.click('.template-tab[data-tab="paste"]');
    await page.waitForTimeout(300);
    await page.locator('#templateText').type(testData.templateText, { delay: 10 });
    await page.waitForTimeout(300);
    
    await page.locator('#instructions').type(testData.instructions, { delay: 10 });
    await page.waitForTimeout(300);
    await page.locator('#opposingSubmissions').type(testData.opposingSubmissions, { delay: 10 });
    await page.waitForTimeout(300);

    // Save session
    await page.click('#saveSession');

    // Clear all fields
    await page.click('#clearAll');

    // Verify fields are cleared
    await expect(page.locator('#chronology')).toHaveValue('');
    await expect(page.locator('#arguments')).toHaveValue('');
    await expect(page.locator('#templateText')).toHaveValue('');

    // Load session
    await page.click('#loadSession');

    // Verify data is restored
    await expect(page.locator('#chronology')).toHaveValue(testData.chronology);
    await expect(page.locator('#arguments')).toHaveValue(testData.arguments);
    await expect(page.locator('#templateText')).toHaveValue(testData.templateText);
    await expect(page.locator('input[name="platform"][value="gemini"]')).toBeChecked();
    await expect(page.locator('input[name="position"][value="respondent"]')).toBeChecked();
  });

  test('should show real-time progress and validation', async ({ page }) => {
    // Initially should show 0% progress
    await expect(page.locator('#progressText')).toContainText('0%');

    // Add chronology
    await page.locator('#chronology').type('Test chronology content', { delay: 10 });
    
    // Wait for progress to update
    await page.waitForTimeout(500);

    // Progress should update (not 0% anymore)
    await expect(page.locator('#progressText')).not.toContainText('0%');

    // Add arguments
    await page.locator('#arguments').type('Test arguments content', { delay: 10 });
    await page.waitForTimeout(300);

    // Progress should increase further
    const progressAfterChronology = await page.locator('#progressText').textContent();
    const progressAfterArguments = await page.locator('#progressText').textContent();
    expect(progressAfterArguments).not.toBe('0%');

    // Add template to complete required fields
    await page.click('.template-tab[data-tab="paste"]');
    await page.waitForTimeout(300);
    await page.locator('#templateText').type('Test template content', { delay: 10 });
    await page.waitForTimeout(300);

    // Validation should pass (no warnings visible)
    await page.waitForTimeout(500);
    await expect(page.locator('#validationWarnings')).toHaveCount(0);
    await expect(page.locator('#validationPositive')).toBeVisible();
  });

  test('should handle tab navigation correctly', async ({ page }) => {
    // Test template tabs
    await expect(page.locator('.template-tab[data-tab="paste"]')).toHaveClass(/active/);
    await expect(page.locator('#paste')).toBeVisible();

    await page.click('.template-tab[data-tab="upload"]');
    await page.waitForTimeout(300);
    await expect(page.locator('.template-tab[data-tab="upload"]')).toHaveClass(/active/);
    await expect(page.locator('#upload')).toBeVisible();
    await expect(page.locator('#paste')).toBeHidden();

    // Test pleadings tabs
    await expect(page.locator('#pleadingsTabs .template-tab[data-tab="plaintiff-pleadings"]')).toHaveClass(/active/);
    await expect(page.locator('#plaintiff-pleadings')).toBeVisible();

    await page.click('#pleadingsTabs .template-tab[data-tab="defendant-pleadings"]');
    await expect(page.locator('#pleadingsTabs .template-tab[data-tab="defendant-pleadings"]')).toHaveClass(/active/);
    await expect(page.locator('#defendant-pleadings')).toBeVisible();
    await expect(page.locator('#plaintiff-pleadings')).toBeHidden();

    // Test output tabs (after generating content)
    await page.locator('#chronology').type('test', { delay: 10 });
    await page.waitForTimeout(300);
    await page.locator('#arguments').type('test', { delay: 10 });
    await page.waitForTimeout(300);
    await page.click('.template-tab[data-tab="paste"]');
    await page.waitForTimeout(300);
    await page.locator('#templateText').type('test', { delay: 10 });
    await page.waitForTimeout(300);
    await page.click('#generateBtn');
    await page.waitForTimeout(1000);

    await expect(page.locator('.output-tab[data-output="claude"]')).toHaveClass(/active/);
    await expect(page.locator('#claudeOutput')).toHaveClass(/active/);

    await page.click('.output-tab[data-output="gemini"]');
    await expect(page.locator('.output-tab[data-output="gemini"]')).toHaveClass(/active/);
    await expect(page.locator('#geminiOutput')).toHaveClass(/active/);
    await expect(page.locator('#claudeOutput')).not.toHaveClass(/active/);
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test invalid file upload
    await page.click('.template-tab[data-tab="upload"]');

    // Try to upload a large file (simulated)
    const largeContent = 'x'.repeat(100 * 1024 * 1024); // 100MB
    await page.setInputFiles('#templateFile', {
      name: 'huge-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(largeContent.substring(0, 1000)) // Truncate for test
    });

    // Should show appropriate error message
    await page.waitForTimeout(500);
    await expect(page.locator('#uploadStatus')).toContainText('Error');

    // Test generating prompts with incomplete data
    await page.click('#generateBtn');
    await page.waitForTimeout(500);

    // Should show validation warnings
    await expect(page.locator('#validationWarnings')).toBeVisible();

    // Output section should not appear
    await expect(page.locator('#outputSection')).toBeHidden();
  });
});