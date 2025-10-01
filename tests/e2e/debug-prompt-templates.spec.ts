import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from './shared/utils/api-helpers';

let apiHelpers: APIHelpers;
let testCampaign: any;

test.describe('AI Content Generation Debug Tests', () => {
  test.beforeEach(async ({ page, request }) => {
    test.setTimeout(60000);
    
    apiHelpers = new APIHelpers(request);
    
    // Create a test campaign via API
    testCampaign = await apiHelpers.createCampaign({
      name: 'Debug Test Campaign',
      description: 'Testing AI content generation functionality',
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

  test('should test fake AI provider behavior with different content types', async ({ page }) => {
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    const testCases = [
      { type: 'Headline', content: 'Revolutionary fitness app' },
      { type: 'Description', content: 'Transform your health with innovative technology' },
      { type: 'Social Media Post', content: 'Join the fitness revolution! 💪' }
    ];
    
    for (const testCase of testCases) {
      
      // Open content creation modal
      await page.getByRole('button', { name: 'Add Content' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Select content type
      await page.getByTestId('content-type-select').click();
      await page.getByRole('option', { name: testCase.type }).click();

      // Fill original content
      await page.getByLabel('Original Content *').fill(testCase.content);

      // Select AI provider
      await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

      // Fill custom prompt if available
      const customPromptField = page.getByPlaceholder('Customize your prompt...');
      const hasCustomPromptField = await customPromptField.isVisible().catch(() => false);
      
      if (hasCustomPromptField) {
        await customPromptField.fill(`Generate compelling ${testCase.type.toLowerCase()} content`);
      }

      // Generate content
      await page.getByRole('button', { name: 'Generate with AI' }).click();

      // Wait for generation to complete
      await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

      // Check the generated content
      const generatedContentElement = page.getByTestId('generated-content');
      const isVisible = await generatedContentElement.isVisible().catch(() => false);
      
      if (isVisible) {
        const generatedText = await generatedContentElement.textContent();
        
        // Verify fake provider format
        expect(generatedText).toBeTruthy();
        expect(generatedText).toContain('AI-Generated (fake):');
        expect(generatedText).toContain(testCase.content);
        expect(generatedText).toContain('Compelling & Engaging!');
      }

      // Save content
      await page.locator('button:has-text("Save")').click();
      await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });

      // Wait for content card to appear and verify it exists
      await expect(page.getByTestId('content-card').first()).toBeVisible({ timeout: 10000 });

    }
    
    // Verify all content was created (should have at least the number of test cases)
    const contentCards = await page.getByTestId('content-card').count();
    expect(contentCards).toBeGreaterThanOrEqual(testCases.length);
  });

  test('should validate fake AI provider consistency', async ({ page }) => {
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    const testContent = 'Test content for consistency validation';
    
    // Generate content multiple times to test consistency
    for (let i = 1; i <= 3; i++) {
      
      // Open content creation modal
      await page.getByRole('button', { name: 'Add Content' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill content
      await page.getByTestId('content-type-select').click();
      await page.getByRole('option', { name: 'Headline' }).click();
      await page.getByLabel('Original Content *').fill(`${testContent} ${i}`);

      // Select AI provider
      await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

      // Generate content
      await page.getByRole('button', { name: 'Generate with AI' }).click();

      // Wait for generation
      await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

      // Verify consistent fake provider behavior
      await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();
      await expect(page.getByText(`${testContent} ${i}`).first()).toBeVisible();
      await expect(page.getByText('Compelling & Engaging!').first()).toBeVisible();

      // Save content
      await page.locator('button:has-text("Save")').click();
      await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });
      
    }
  });

  test('should handle custom prompts with fake provider', async ({ page }) => {
    // Navigate to the campaign page
    await page.goto(`/campaigns/${testCampaign.id}`);
    
    const customPrompts = [
      'Create professional marketing content',
      'Write engaging social media copy',
      'Generate compelling call-to-action text'
    ];
    
    for (let i = 0; i < customPrompts.length; i++) {
      const customPrompt = customPrompts[i];
      
      // Open content creation modal
      await page.getByRole('button', { name: 'Add Content' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill content
      await page.getByTestId('content-type-select').click();
      await page.getByRole('option', { name: 'Headline' }).click();
      await page.getByLabel('Original Content *').fill(`Test content ${i + 1}`);

      // Select AI provider
      await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

      // Fill custom prompt
      const customPromptField = page.getByPlaceholder('Customize your prompt...');
      const hasCustomPromptField = await customPromptField.isVisible().catch(() => false);
      
      if (hasCustomPromptField) {
        await customPromptField.fill(customPrompt);
      }

      // Generate content
      await page.getByRole('button', { name: 'Generate with AI' }).click();

      // Wait for generation
      await expect(page.getByText('AI content generated').first()).toBeVisible({ timeout: 30000 });

      // Verify fake provider output
      await expect(page.getByText('AI-Generated (fake):').first()).toBeVisible();

      // Save content
      await page.locator('button:has-text("Save")').click();
      await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });
      
    }
  });
});