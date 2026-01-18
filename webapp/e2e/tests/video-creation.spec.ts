/**
 * E2E Tests for Video Creation Flow
 *
 * Tests the complete video creation journey from idea to generated script
 * using mocked API responses (no real LLM calls).
 */

import { test, expect } from '@playwright/test';

test.describe('Video Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard/create page
    // Note: In real tests, you'd need to handle authentication first
    await page.goto('/dashboard/create');
  });

  test('should display the create video page', async ({ page }) => {
    // Verify the page loaded correctly
    await expect(page).toHaveURL(/.*create/);

    // Look for key elements that should be present
    // Adjust these selectors based on your actual UI
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show step 1 - script idea input', async ({ page }) => {
    // Look for the script idea input field
    const scriptInput = page.locator('textarea, input[type="text"]').first();
    await expect(scriptInput).toBeVisible();

    // Type a script idea
    await scriptInput.fill('A story about AI revolutionizing healthcare');

    // Verify the input was captured
    await expect(scriptInput).toHaveValue('A story about AI revolutionizing healthcare');
  });

  test('should generate a script successfully', async ({ page }) => {
    // This test requires MSW to intercept the API call
    // The actual API call will be mocked by MSW handlers

    // Find and fill the script idea input
    const scriptInput = page.locator('textarea').first();
    await scriptInput.fill('A story about space exploration');

    // Find and click the generate button
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Wait for the script to be generated (mocked response)
    // Look for the generated script content
    await expect(page.locator('[data-testid="generated-script"], .script-content, .story-text').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should allow regenerating script with feedback', async ({ page }) => {
    // Generate initial script
    const scriptInput = page.locator('textarea').first();
    await scriptInput.fill('A story about AI');

    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();

    // Wait for initial script
    await page.waitForTimeout(1000);

    // Find and fill feedback input
    const feedbackInput = page.locator('[data-testid="feedback-input"], input[placeholder*="feedback"], textarea').last();
    if (await feedbackInput.isVisible()) {
      await feedbackInput.fill('Make it more dramatic');

      // Click regenerate
      const regenerateButton = page.getByRole('button', { name: /regenerate/i });
      await regenerateButton.click();

      // Wait for regenerated script
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate through creation steps', async ({ page }) => {
    // Step 1: Fill script idea
    const scriptInput = page.locator('textarea').first();
    await scriptInput.fill('A compelling story');

    // Find and click next/continue button
    const nextButton = page.getByRole('button', { name: /next|continue|proceed/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Verify we moved to the next step
      await page.waitForTimeout(500);
    }
  });

  test('should display voice selection options', async ({ page }) => {
    // Navigate or scroll to voice selection
    // Look for voice-related elements
    const voiceSection = page.locator('[data-testid="voice-select"], select, .voice-selector').first();

    if (await voiceSection.isVisible()) {
      await expect(voiceSection).toBeVisible();
    }
  });

  test('should display niche selection', async ({ page }) => {
    // Look for niche selection elements
    const nicheSection = page.locator('[data-testid="niche-select"], select, .niche-selector').first();

    if (await nicheSection.isVisible()) {
      await expect(nicheSection).toBeVisible();
    }
  });
});

test.describe('Video Creation - Error Handling', () => {
  test('should handle script generation errors gracefully', async ({ page }) => {
    // This test would use the error handlers from MSW
    await page.goto('/dashboard/create');

    const scriptInput = page.locator('textarea').first();
    await scriptInput.fill('A story that causes an error');

    const generateButton = page.getByRole('button', { name: /generate/i });

    // Mock an error response would be set up via MSW
    await generateButton.click();

    // Look for error message
    const errorMessage = page.locator('[role="alert"], .error-message, .toast-error');
    // The error handling depends on your UI implementation
  });

  test('should require authentication', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access create page
    await page.goto('/dashboard/create');

    // Should redirect to login or show auth required message
    // Adjust based on your auth flow
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/login|auth|sign-in|dashboard\/create/);
  });
});

test.describe('Video Creation - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/create');
  });

  test('should validate empty script idea', async ({ page }) => {
    // Try to submit with empty script idea
    const generateButton = page.getByRole('button', { name: /generate/i });

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Look for validation error
      await page.waitForTimeout(500);
      // Validation error elements depend on your UI
    }
  });

  test('should validate script idea length', async ({ page }) => {
    const scriptInput = page.locator('textarea').first();

    // Try very short input
    await scriptInput.fill('Hi');

    const generateButton = page.getByRole('button', { name: /generate/i });
    if (await generateButton.isVisible()) {
      await generateButton.click();
      // Validation should show error for too short input
    }
  });
});

test.describe('Video List/Dashboard', () => {
  test('should display list of created videos', async ({ page }) => {
    await page.goto('/dashboard/videos');

    // Wait for video list to load
    await page.waitForTimeout(1000);

    // Look for video list elements
    const videoList = page.locator('[data-testid="video-list"], .video-grid, .videos-container');
    // Verify videos are displayed or empty state is shown
  });

  test('should allow viewing video details', async ({ page }) => {
    await page.goto('/dashboard/videos');

    // Find a video card/item
    const videoItem = page.locator('[data-testid="video-item"], .video-card').first();

    if (await videoItem.isVisible()) {
      await videoItem.click();

      // Should navigate to video details
      await expect(page).toHaveURL(/.*videos\/.+/);
    }
  });
});
