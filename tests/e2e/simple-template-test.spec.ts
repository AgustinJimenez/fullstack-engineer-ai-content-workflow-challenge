import { test, expect } from '@playwright/test';
import { TestConfig } from './shared/utils/test-config';

test.describe('Simple Template Test', () => {
  test('Verify frontend displays multiple options correctly', async ({ page }) => {
    // Navigate to campaigns
    await page.goto(TestConfig.buildFrontendUrl('/campaigns'));
    
    // Wait a bit for data to load
    await page.waitForTimeout(3000);
    
    // Click on any existing campaign (should be one from API tests)
    const campaignCard = page.locator('.campaign-card').first();
    if (await campaignCard.count() > 0) {
      await campaignCard.click();
    } else {
      // If no campaign exists, skip this test
      test.skip(true, 'No existing campaigns found');
    }
    
    // Create content
    await page.getByRole('button', { name: 'Add Content' }).click();
    await page.fill('textarea[placeholder="Enter your original content"]', 'Revolutionary fitness app');
    
    // Test Default (3-5 options) template
    await page.click('[data-testid="prompt-template-select"]');
    await page.click('text=Default (3-5 options)');
    
    const promptText = await page.inputValue('textarea[placeholder="Customize your prompt..."]');
    
    await page.getByRole('button', { name: 'Generate with AI' }).click();
    await page.waitForSelector('[data-testid="generated-content"]', { timeout: 30000 });
    
    const generatedText = await page.inputValue('[data-testid="generated-content"]');
    
    // Check if it contains multiple lines with numbers
    const lines = generatedText.split('\n').filter(l => l.trim());
    const numberedLines = generatedText.match(/^\s*\d+\./gm) || [];
    
    
    // The issue might be that multiple options are being returned but displayed as single line
    // Let's check if the content contains multiple options separated by something other than newlines
    
    expect(lines.length).toBeGreaterThan(1);
  });
});