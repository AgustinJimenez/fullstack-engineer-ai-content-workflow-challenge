import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns, analysisTestContent } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should show active filter badges and allow individual removal', async ({ page }) => {
  // Setup: Create campaign with analyzed content
  const campaign = await apiHelpers.createCampaign(testCampaigns.product);
  const content = await apiHelpers.createContent(campaign.id, analysisTestContent.enthusiastic);
  await apiHelpers.analyzeContent(content.id, {});
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Apply multiple filters
  await page.getByTestId('status-filter-select').click();
  await page.getByRole('option', { name: 'Draft' }).click();
  
  await page.getByTestId('tone-filter-select').click();
  await page.getByRole('option', { name: 'Enthusiastic' }).click();
  await page.getByLabel('Keywords').fill('amazing');
  
  // Should show active filter badges
  await expect(page.getByText('Status: draft')).toBeVisible();
  await expect(page.locator('.rounded-md.border').getByText('Tone: enthusiastic')).toBeVisible();
  await expect(page.getByText('Keyword: amazing')).toBeVisible();
  
  // Remove individual filters by clicking the × button
  // Target filter badges specifically to avoid conflicts with analysis results
  await page.locator('text=Status: draft').locator('button').click();
  await expect(page.locator('.rounded-md.border').filter({ hasText: 'Status: draft' })).not.toBeVisible();
  
  await page.locator('text=Tone: enthusiastic').locator('button').click();
  await expect(page.locator('.rounded-md.border').filter({ hasText: 'Tone: enthusiastic' })).not.toBeVisible();
  
  await page.locator('text=Keyword: amazing').locator('button').click();
  await expect(page.locator('.rounded-md.border').filter({ hasText: 'Keyword: amazing' })).not.toBeVisible();
});