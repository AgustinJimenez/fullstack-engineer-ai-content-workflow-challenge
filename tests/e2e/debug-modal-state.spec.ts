import { test, expect } from '@playwright/test';
import { APIHelpers } from './shared/utils/api-helpers';
import { testCampaigns } from './shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.describe('Debug Modal State Issue', () => {
  test('should debug the modal flashing issue during AI generation', async ({ page, request }) => {
    // Setup: Create campaign via API
    const campaign = await apiHelpers.createCampaign(testCampaigns.marketing);
    
    // Navigate to campaign detail page
    await page.goto(`/campaigns/${campaign.id}`);
    
    // Wait for page to load
    await expect(page.getByText('No content pieces yet')).toBeVisible();
    
    // Click "Add Content" button to open modal
    await page.getByRole('button', { name: 'Add Content' }).click();
    
    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create Content' })).toBeVisible();
    
    // Fill out the minimum required fields
    await page.getByTestId('content-type-select').click();
    await page.getByRole('option', { name: 'Headline' }).click();
    
    // Fill original content (required)
    await page.getByLabel('Original Content').fill('Test headline for debugging modal state');
    
    // Check if AI provider buttons are visible
    await expect(page.getByText('OpenAI GPT-4')).toBeVisible();
    await expect(page.getByText('Anthropic Claude')).toBeVisible();
    
    // Generate with AI button should be enabled
    const generateButton = page.getByRole('button', { name: 'Generate with AI' });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
    
    // Set up monitoring for dialog visibility
    const dialog = page.getByRole('dialog');
    
    
    // Click Generate with AI and monitor what happens
    await generateButton.click();
    
    // Check if loading state appears
    await expect(page.getByText('Generating...')).toBeVisible();
    
    // Monitor dialog during the process
    let dialogVisible = await dialog.isVisible();
    
    // Wait a bit and check again
    await page.waitForTimeout(1000);
    dialogVisible = await dialog.isVisible();
    
    // Check what's in the dialog now
    const modalContent = await page.getByRole('dialog').textContent();
    
    // Wait for either success transition or failure
    try {
      // Try to wait for the review step
      await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible({ timeout: 15000 });
      
      // Check dialog is still visible
      dialogVisible = await dialog.isVisible();
      
    } catch (error) {
      
      // Check if we're back to the setup step (which would indicate the bug)
      const backToSetup = await page.getByRole('heading', { name: 'Create Content' }).isVisible();
      
      // Check dialog state
      dialogVisible = await dialog.isVisible();
      
      // Check what content is in the modal
      const currentContent = await page.getByRole('dialog').textContent();
      
      // Check if original content is still there
      const originalContentField = page.getByLabel('Original Content');
      const hasOriginalContent = await originalContentField.isVisible();
      
      if (hasOriginalContent) {
        const value = await originalContentField.inputValue();
      }
      
      throw new Error(`Failed to complete AI generation workflow. Back to setup: ${backToSetup}`);
    }
  });
});