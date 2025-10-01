import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from './shared/utils/api-helpers';

let apiHelpers: APIHelpers;
let testCampaign: any;

test.describe('AI Content Generation Options', () => {
  test.beforeEach(async ({ page, request }) => {
    test.setTimeout(60000);
    
    apiHelpers = new APIHelpers(request);
    
    // Create a test campaign via API
    testCampaign = await apiHelpers.createCampaign({
      name: 'Content Generation Test',
      description: 'Testing different AI content generation options',
      targetLanguages: ['es', 'fr']
    });
    
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    // Open content creation modal
    await page.getByRole('button', { name: 'Add Content' }).click();
  });
  
  test.afterEach(async () => {
    // Clean up the test campaign
    if (testCampaign) {
      try {
        await apiHelpers.deleteCampaign(testCampaign.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('should generate headline content with AI', async ({ page }) => {
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select content type from dropdown using test id
    await page.getByTestId('content-type-select').click();
    await page.getByRole('option', { name: 'Headline' }).click();

    // Fill original content
    await page.getByLabel('Original Content *').fill('Revolutionary fitness app that transforms your health journey');

    // Select AI provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation to complete
    await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();

    // Verify AI-generated content appears (with fake provider output)
    await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();
    
    // Verify original content is still shown
    await expect(page.getByText('Revolutionary fitness app that transforms your health journey').first()).toBeVisible();

    // Save content
    await page.locator('button:has-text("Save")').click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });

    // Verify content appears in campaign
    await expect(page.getByTestId('content-card')).toBeVisible();
  });

  test('should generate description content with AI', async ({ page }) => {
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select description content type
    await page.getByTestId('content-type-select').click();
    await page.getByRole('option', { name: 'Description' }).click();

    // Fill original content
    await page.getByLabel('Original Content *').fill('Comprehensive fitness tracking app with personalized workout plans and nutrition guidance');

    // Select AI provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation to complete
    await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

    // Verify AI-generated content appears
    await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();

    // Save content
    await page.locator('button:has-text("Save")').click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });
  });

  test('should generate call-to-action content with AI', async ({ page }) => {
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select CTA content type
    await page.getByTestId('content-type-select').click();
    await page.getByRole('option', { name: 'Call to Action' }).click();

    // Fill original content
    await page.getByLabel('Original Content *').fill('Start your fitness journey today');

    // Select AI provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation to complete
    await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

    // Verify AI-generated content appears
    await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();

    // Save content
    await page.locator('button:has-text("Save")').click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });
  });

  test('should handle custom prompts in AI generation', async ({ page }) => {
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select content type
    await page.getByTestId('content-type-select').click();
    await page.getByRole('option', { name: 'Headline' }).click();

    // Fill original content
    await page.getByLabel('Original Content *').fill('AI-powered fitness coach app');

    // Select AI provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Fill custom prompt if available
    const customPromptField = page.getByPlaceholder('Customize your prompt...');
    const hasCustomPrompt = await customPromptField.isVisible().catch(() => false);
    
    if (hasCustomPrompt) {
      await customPromptField.fill('Create an engaging headline that emphasizes innovation and personal transformation');
    }

    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation to complete
    await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

    // Verify AI-generated content appears
    await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();

    // Save content
    await page.locator('button:has-text("Save")').click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });
  });
});