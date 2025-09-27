import { test, expect } from '@playwright/test';
import { APIHelpers } from './shared/utils/api-helpers';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.describe('UI Elements Debug', () => {
  test('should inspect campaigns page UI elements', async ({ page }) => {
    await page.goto('/campaigns');
    
    
    // Check what buttons are available
    const allButtons = await page.getByRole('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
    }
    
    // Check for headings
    const allHeadings = await page.getByRole('heading').all();
    for (let i = 0; i < allHeadings.length; i++) {
      const headingText = await allHeadings[i].textContent();
    }
    
    // Check for links
    const allLinks = await page.getByRole('link').all();
    for (let i = 0; i < allLinks.length; i++) {
      const linkText = await allLinks[i].textContent();
    }
    
    // Take screenshot for reference
    await page.screenshot({ path: 'campaigns-page-debug.png', fullPage: true });
  });
  
  test('should inspect campaign detail page UI elements', async ({ page }) => {
    // Create a test campaign
    const campaign = await apiHelpers.createCampaign({
      name: 'Debug Campaign',
      description: 'For debugging UI elements',
      targetLanguages: ['es', 'fr']
    });
    
    await page.goto(`/campaigns/${campaign.id}`);
    
    
    // Check page content
    const pageContent = await page.textContent('body');
    
    // Check what buttons are available
    const allButtons = await page.getByRole('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
    }
    
    // Look for specific text patterns
    const targetLanguageTexts = [
      'Target Languages: es, fr',
      'Target Languages: Spanish, French',
      'es, fr',
      'Spanish, French',
      'Target Languages'
    ];
    
    for (const text of targetLanguageTexts) {
      const element = page.getByText(text);
      const isVisible = await element.count() > 0;
    }
    
    // Take screenshot
    await page.screenshot({ path: 'campaign-detail-debug.png', fullPage: true });
  });
  
  test('should inspect content creation modal UI elements', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: 'Modal Debug Campaign',
      description: 'For debugging modal elements',
      targetLanguages: ['es']
    });
    
    await page.goto(`/campaigns/${campaign.id}`);
    
    
    // Try to open content creation modal
    const addContentButtons = await page.getByRole('button').all();
    
    let addContentButton = null;
    for (const button of addContentButtons) {
      const text = await button.textContent();
      if (text?.includes('Add Content') || text?.includes('Create') || text?.includes('New')) {
        addContentButton = button;
        break;
      }
    }
    
    if (addContentButton) {
      await addContentButton.click();
      
      // Wait a bit for modal to appear
      await page.waitForTimeout(1000);
      
      // Check for dialog
      const dialogs = await page.getByRole('dialog').all();
      
      if (dialogs.length > 0) {
        
        // Check content type buttons
        const modalButtons = await page.getByRole('button').all();
        for (let i = 0; i < modalButtons.length; i++) {
          const buttonText = await modalButtons[i].textContent();
        }
        
        // Check for content type options
        const contentTypes = ['headline', 'Headline', 'product_description', 'Product Description', 'social_post', 'Social Post'];
        for (const type of contentTypes) {
          const element = page.getByText(type);
          const isVisible = await element.count() > 0;
        }
      } else {
      }
      
      // Take screenshot
      await page.screenshot({ path: 'content-modal-debug.png', fullPage: true });
    } else {
    }
  });
});