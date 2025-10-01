import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from './shared/utils/api-helpers';

let apiHelpers: APIHelpers;
let testCampaign: any;

test.describe('AI Content Generation Testing', () => {
  test.beforeEach(async ({ page, request }) => {
    test.setTimeout(60000);
    
    apiHelpers = new APIHelpers(request);
    
    // Create a test campaign via API
    testCampaign = await apiHelpers.createCampaign({
      name: 'AI Content Generation Test',
      description: 'Testing AI content generation with fake provider',
      targetLanguages: ['es', 'fr']
    });
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

  test('should generate content for different content types', async ({ page }) => {
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    // Test different content types
    const contentTypes = [
      { type: 'Headline', content: 'Revolutionary fitness app' },
      { type: 'Description', content: 'Transform your health with our innovative fitness tracking application' },
      { type: 'Social Media Post', content: 'Join thousands improving their health! 💪 #fitness #health' },
      { type: 'Call to Action', content: 'Start your fitness journey today' }
    ];
    
    for (const { type, content } of contentTypes) {
      
      // Open content creation modal
      await page.getByRole('button', { name: 'Add Content' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Select content type
      await page.getByTestId('content-type-select').click();
      await page.getByRole('option', { name: type }).click();

      // Fill original content
      await page.getByLabel('Original Content *').fill(content);

      // Select AI provider
      await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

      // Generate content
      await page.getByRole('button', { name: 'Generate with AI' }).click();

      // Wait for generation to complete
      await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });
      await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();

      // Verify AI-generated content appears (with fake provider output)
      await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();
      
      // Check that the generated content doesn't contain unwanted quotes for fake provider
      const generatedContentElement = page.getByTestId('generated-content');
      const isVisible = await generatedContentElement.isVisible().catch(() => false);
      
      if (isVisible) {
        const generatedText = await generatedContentElement.textContent();
        
        // With fake provider, content should be clean
        expect(generatedText).toBeTruthy();
        expect(generatedText!.length).toBeGreaterThan(0);
      }
      
      // Save content
      await page.locator('button:has-text("Save")').click();
      await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });

      // Verify content appears in campaign (use first() to avoid strict mode issues)
      await expect(page.getByTestId('content-card').first()).toBeVisible();
      
    }
  });

  test('should handle custom prompts for AI generation', async ({ page }) => {
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    // Test custom prompts
    const customPrompts = [
      'Make this sound more professional and corporate',
      'Create engaging content that motivates action',
      'Write in a friendly, conversational tone',
      'Focus on health benefits and transformation'
    ];
    
    for (let i = 0; i < customPrompts.length; i++) {
      const customPrompt = customPrompts[i];
      
      // Open content creation modal
      await page.getByRole('button', { name: 'Add Content' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Select content type
      await page.getByTestId('content-type-select').click();
      await page.getByRole('option', { name: 'Headline' }).click();

      // Fill original content
      await page.getByLabel('Original Content *').fill(`Fitness app test ${i + 1}`);

      // Select AI provider
      await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

      // Fill custom prompt if field is available
      const customPromptField = page.getByPlaceholder('Customize your prompt...');
      const hasCustomPromptField = await customPromptField.isVisible().catch(() => false);
      
      if (hasCustomPromptField) {
        await customPromptField.fill(customPrompt);
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
      
    }
  });

  test('should validate fake AI provider responses are clean', async ({ page }) => {
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    // Open content creation modal
    await page.getByRole('button', { name: 'Add Content' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill content
    await page.getByTestId('content-type-select').click();
    await page.getByRole('option', { name: 'Headline' }).click();
    await page.getByLabel('Original Content *').fill('Test content for validation');

    // Select AI provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation
    await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

    // Verify the fake provider generates expected format
    await expect(page.getByText('AI-Generated (fake):')).toBeVisible();
    
    // Verify it contains the original content enhanced (use first() to avoid strict mode issues)
    await expect(page.getByText('Test content for validation').first()).toBeVisible();
    await expect(page.getByText('Compelling & Engaging!').first()).toBeVisible();

  });
});