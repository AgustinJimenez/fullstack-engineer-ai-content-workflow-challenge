import { test, expect } from '@playwright/test';
import { APIHelpers } from './shared/utils/api-helpers';
import { TestConfig } from './shared/utils/test-config';

test.describe('Single Template Quote Test', () => {
  test('Test Single Option template for quote removal', async ({ page, request }) => {
    const apiHelpers = new APIHelpers(request);
    
    // Create a campaign via API (faster and more reliable)
    const campaign = await apiHelpers.createCampaign({
      name: 'Single Quote Test',
      description: 'Testing single option quote removal',
      targetLanguages: ['es']
    });
    
    // Navigate directly to the campaign
    await page.goto(TestConfig.buildFrontendUrl(`/campaigns/${campaign.id}`));
    
    // Create content
    await page.getByRole('button', { name: 'Add Content' }).click();
    await page.waitForSelector('#original-content', { timeout: 10000 });
    await page.fill('#original-content', 'Revolutionary fitness app');
    
    // Select the provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    
    // Select Single Option template
    await page.click('[data-testid="prompt-template-select"]');
    await page.click('text="Single Option"');
    
    // Get the prompt
    const promptText = await page.inputValue('textarea[placeholder="Customize your prompt..."]');
    
    // Verify it's a single option prompt
    const isSingleOption = promptText.toLowerCase().includes('exactly one') || 
                          promptText.toLowerCase().includes('single');
    expect(isSingleOption).toBe(true);
    
    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();
    
    // Wait for generation to complete (increased timeout for analysis)
    await page.waitForSelector('[data-testid="generated-content"]', { timeout: 60000 });
    
    // Get the generated content
    const generatedText = await page.inputValue('[data-testid="generated-content"]');
    
    // Check for quotes
    const hasQuotes = /[""]/.test(generatedText);
    const lines = generatedText.split('\n').filter(l => l.trim());
    
    
    // Single Option template should remove quotes
    expect(hasQuotes).toBe(false);
    expect(lines.length).toBe(1);
    
    // Clean up
    try {
      await apiHelpers.deleteCampaign(campaign.id);
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});