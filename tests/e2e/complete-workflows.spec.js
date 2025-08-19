/**
 * Complete Workflow E2E Tests
 * Tests full user journeys from start to finish
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Submissions Synthesizer');
  });

  test('should complete full applicant workflow', async ({ page }) => {
    // Step 1: Verify initial state
    await expect(page.locator('input[name="platform"][value="claude"]')).toBeChecked();
    await expect(page.locator('input[name="position"][value="applicant"]')).toBeChecked();

    // Step 2: Fill chronology
    const chronologyText = 'January 1, 2024: Contract signed between parties\nFebruary 15, 2024: First payment due\nMarch 1, 2024: Payment not received\nMarch 15, 2024: Notice of breach sent';
    await page.fill('#chronology', chronologyText);
    
    // Verify character counter updates
    await expect(page.locator('#chronologyCounter')).toContainText(chronologyText.length.toString());

    // Step 3: Fill arguments
    const argumentsText = 'Material breach of payment terms\nDamages in amount of $50,000\nInterest and attorney fees\nInjunctive relief to prevent further harm';
    await page.fill('#arguments', argumentsText);

    // Step 4: Add template content
    const templateText = `MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE COURT:

Plaintiff respectfully moves this Court for summary judgment in its favor and against Defendant on all claims stated in the Complaint.

I. STATEMENT OF FACTS

The undisputed material facts establish that Defendant breached its contractual obligations...`;
    
    await page.fill('#templateText', templateText);

    // Step 5: Add instructions
    const instructionsText = 'Please ensure proper citation to Federal Rules\nUse formal court language\nInclude damages calculation table\nReference all supporting exhibits';
    await page.fill('#instructions', instructionsText);

    // Step 6: Verify validation passes
    await expect(page.locator('#validationWarnings')).toBeEmpty();

    // Step 7: Generate prompts
    await page.click('#generateBtn');

    // Step 8: Verify output appears
    await expect(page.locator('#outputSection')).toBeVisible();
    await expect(page.locator('#claudePromptOutput')).toContainText(chronologyText);
    await expect(page.locator('#claudePromptOutput')).toContainText(argumentsText);
    await expect(page.locator('#claudePromptOutput')).toContainText('applicant');

    // Step 9: Test copy functionality
    await page.click('#copyClaude');
    
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
    await page.fill('#opposingSubmissions', opposingText);

    // Step 4: Fill defense chronology
    const defenseChronology = 'January 1, 2024: Contract signed with modified terms\nFebruary 10, 2024: Force majeure event occurred\nFebruary 20, 2024: Notice sent to plaintiff\nMarch 5, 2024: Attempted cure of any alleged breach';
    await page.fill('#chronology', defenseChronology);

    // Step 5: Fill defense arguments
    const defenseArguments = 'No material breach occurred\nForce majeure excuses performance\nPlaintiff waived right to claim breach\nDamages are speculative and unproven\nInjunctive relief is inappropriate';
    await page.fill('#arguments', defenseArguments);

    // Step 6: Add response template
    const responseTemplate = `RESPONSE TO MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE COURT:

Defendant respectfully opposes Plaintiff's Motion for Summary Judgment and requests that the Court deny the motion in its entirety.

I. STATEMENT OF DISPUTED FACTS

Contrary to Plaintiff's assertions, genuine issues of material fact preclude summary judgment...`;
    
    await page.fill('#templateText', responseTemplate);

    // Step 7: Generate prompts
    await page.click('#generateBtn');

    // Step 8: Verify respondent-specific content
    await expect(page.locator('#claudePromptOutput')).toContainText('respondent');
    await expect(page.locator('#claudePromptOutput')).toContainText('opposing');
    await expect(page.locator('#claudePromptOutput')).toContainText(opposingText);
  });

  test('should handle platform switching correctly', async ({ page }) => {
    // Fill basic required fields
    await page.fill('#chronology', 'Test chronology');
    await page.fill('#arguments', 'Test arguments');
    await page.fill('#templateText', 'Test template');

    // Test Claude platform
    await page.click('input[name="platform"][value="claude"]');
    await page.click('#generateBtn');
    await expect(page.locator('#claudePromptOutput')).toContainText('Test chronology');

    // Switch to Gemini platform
    await page.click('input[name="platform"][value="gemini"]');
    await page.click('#generateBtn');
    await expect(page.locator('#geminiPromptOutput')).toContainText('Test chronology');

    // Switch to Both platforms
    await page.click('input[name="platform"][value="both"]');
    await page.click('#generateBtn');
    
    // Verify both outputs are generated
    await expect(page.locator('#claudePromptOutput')).toContainText('Test chronology');
    await expect(page.locator('#geminiPromptOutput')).toContainText('Test chronology');
  });

  test('should handle file upload workflow', async ({ page }) => {
    // Switch to upload tab
    await page.click('.template-tab[data-tab="upload"]');
    await expect(page.locator('#uploadContent')).toBeVisible();
    await expect(page.locator('#pasteContent')).toBeHidden();

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

    await page.fill('#chronology', testData.chronology);
    await page.fill('#arguments', testData.arguments);
    await page.fill('#templateText', testData.templateText);
    await page.fill('#instructions', testData.instructions);
    await page.fill('#opposingSubmissions', testData.opposingSubmissions);

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
    await page.fill('#chronology', 'Test chronology content');
    
    // Progress should update (not 0% anymore)
    const progressAfterChronology = await page.locator('#progressText').textContent();
    expect(progressAfterChronology).not.toContain('0%');

    // Add arguments
    await page.fill('#arguments', 'Test arguments content');
    
    // Progress should increase further
    const progressAfterArguments = await page.locator('#progressText').textContent();
    expect(progressAfterArguments).not.toBe(progressAfterChronology);

    // Add template to complete required fields
    await page.fill('#templateText', 'Test template content');
    
    // Validation should pass (no warnings visible)
    await expect(page.locator('#validationWarnings')).toBeEmpty();
    await expect(page.locator('#validationPositive')).toBeVisible();
  });

  test('should handle tab navigation correctly', async ({ page }) => {
    // Test template tabs
    await expect(page.locator('.template-tab[data-tab="paste"]')).toHaveClass(/active/);
    await expect(page.locator('#pasteContent')).toBeVisible();
    
    await page.click('.template-tab[data-tab="upload"]');
    await expect(page.locator('.template-tab[data-tab="upload"]')).toHaveClass(/active/);
    await expect(page.locator('#uploadContent')).toBeVisible();
    await expect(page.locator('#pasteContent')).toBeHidden();

    // Test pleadings tabs
    await expect(page.locator('#pleadingsTabs .template-tab[data-tab="plaintiff"]')).toHaveClass(/active/);
    await expect(page.locator('#plaintiffContent')).toBeVisible();
    
    await page.click('#pleadingsTabs .template-tab[data-tab="defendant"]');
    await expect(page.locator('#pleadingsTabs .template-tab[data-tab="defendant"]')).toHaveClass(/active/);
    await expect(page.locator('#defendantContent')).toBeVisible();
    await expect(page.locator('#plaintiffContent')).toBeHidden();

    // Test output tabs (after generating content)
    await page.fill('#chronology', 'test');
    await page.fill('#arguments', 'test');
    await page.fill('#templateText', 'test');
    await page.click('#generateBtn');

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
    await expect(page.locator('#uploadStatus')).toContainText('Error');

    // Test generating prompts with incomplete data
    await page.click('#generateBtn');
    
    // Should show validation warnings
    await expect(page.locator('#validationWarnings')).toBeVisible();
    
    // Output section should not appear
    await expect(page.locator('#outputSection')).toBeHidden();
  });
});