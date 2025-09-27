import { test as base } from '@playwright/test';

export const test = base.extend({
  // Add custom fixtures if needed
});

export { expect } from '@playwright/test';

// Helper functions for test setup
export async function createTestCampaigns(page: any, count: number = 15) {
  const campaigns = [];
  
  for (let i = 1; i <= count; i++) {
    await page.click('[data-testid="create-campaign-header-button"]');
    
    const campaignName = `Test Campaign ${i}`;
    const campaignDescription = `Description for test campaign ${i}`;
    
    await page.fill('input[name="name"]', campaignName);
    await page.fill('textarea[name="description"]', campaignDescription);
    
    // Add some target languages for variety
    if (i % 3 === 0) {
      await page.fill('input[name="targetLanguages"]', 'es,fr');
    }
    
    await page.click('button[type="submit"]');
    
    // Wait for modal to close
    await page.waitForSelector('[data-testid="create-campaign-header-button"]', { timeout: 5000 });
    
    campaigns.push({
      name: campaignName,
      description: campaignDescription
    });
    
    // Small delay to avoid overwhelming the API
    await page.waitForTimeout(100);
  }
  
  return campaigns;
}

export async function cleanupTestCampaigns(page: any) {
  // This would ideally use a test-specific cleanup endpoint
  // For now, we'll rely on the backend's test cleanup functionality
  try {
    await page.request.delete('http://localhost:3001/api/campaigns/test/cleanup', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.warn('Could not cleanup test campaigns:', error);
  }
}