import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns, analysisTestContent } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should filter content by analysis criteria', async ({ page }) => {
  // Setup: Create campaign with multiple content pieces
  const campaign = await apiHelpers.createCampaign(testCampaigns.marketing);
  
  // Create content with different characteristics
  const enthusiasticContent = await apiHelpers.createContent(campaign.id, analysisTestContent.enthusiastic);
  const professionalContent = await apiHelpers.createContent(campaign.id, analysisTestContent.professional);
  const neutralContent = await apiHelpers.createContent(campaign.id, analysisTestContent.neutral);
  
  // Generate analyses for all content
  await apiHelpers.analyzeContent(enthusiasticContent.id, {});
  await apiHelpers.analyzeContent(professionalContent.id, {});
  await apiHelpers.analyzeContent(neutralContent.id, {});
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Should show all 3 content pieces initially
  await expect(page.getByText('Content Pieces (3)')).toBeVisible();
  
  // Test tone filter (shadcn Select renders in portal)
  await page.getByTestId('tone-filter-select').click();
  await page.waitForTimeout(500);
  await page.getByText('Professional', { exact: true }).click();
  await page.waitForTimeout(1000);
  
  // Should show filtered results
  await expect(page.getByText('Content Pieces (1 of 3)')).toBeVisible();
  
  // Clear tone filter
  await page.getByTestId('tone-filter-select').click();
  await page.waitForTimeout(500);
  await page.getByText('All tones', { exact: true }).click();
  await page.waitForTimeout(500);
  
  // Test sentiment filter
  await page.getByTestId('sentiment-filter-select').click();
  await page.waitForTimeout(500);
  await page.getByText('Positive', { exact: true }).click();
  await page.waitForTimeout(1000);
  
  // Should show content with positive sentiment
  await expect(page.getByText('Content Pieces (1 of 3)')).toBeVisible();
  
  // Clear sentiment filter (shadcn Select)
  await page.getByTestId('sentiment-filter-select').click();
  await page.getByRole('option', { name: 'All sentiments' }).click();
  await page.waitForTimeout(500);
  
  // Test keyword filter
  await page.getByLabel('Keywords').fill('revolutionary');
  await page.waitForTimeout(1000);
  
  // Should show content containing the keyword
  await expect(page.getByText('Content Pieces (1 of 3)')).toBeVisible();
  
  // Clear all filters button should work
  await page.getByText('Clear Filters').click();
  await page.waitForTimeout(500);
  await expect(page.getByText('Content Pieces (3)')).toBeVisible();
});