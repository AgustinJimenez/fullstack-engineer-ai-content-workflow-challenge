import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns, analysisTestContent } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should handle no matching results when filtering', async ({ page }) => {
  // Setup: Create campaign with content
  const campaign = await apiHelpers.createCampaign(testCampaigns.valid);
  const content = await apiHelpers.createContent(campaign.id, analysisTestContent.neutral);
  await apiHelpers.analyzeContent(content.id, {});
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Apply filter that won't match any content
  await page.getByLabel('Keywords').fill('nonexistentkeyword');
  await page.waitForTimeout(1000);
  
  // Should show no results message
  await expect(page.getByText('No content matches your filters')).toBeVisible();
  await expect(page.getByText('Try adjusting your search criteria')).toBeVisible();
  
  // Should show "Clear All Filters" button
  const clearButton = page.getByRole('button', { name: 'Clear All Filters' });
  await expect(clearButton).toBeVisible();
  
  // Clicking it should restore all content
  await clearButton.click();
  await page.waitForTimeout(500);
  await expect(page.getByText('Content Pieces (1)')).toBeVisible();
});