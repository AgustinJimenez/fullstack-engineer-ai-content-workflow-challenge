import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should navigate to campaign details and back', async ({ page }) => {
  // Create campaign via API
  const campaign = await apiHelpers.createCampaign(testCampaigns.product);
  
  // Navigate to campaigns page
  await page.goto('/campaigns');
  
  // Click "View Details" button for the specific campaign
  await page.getByTestId(`view-details-${campaign.id}`).click();
  await page.waitForURL(`/campaigns/${campaign.id}`);
  
  // Should be on campaign detail page
  await expect(page.getByRole('heading', { name: campaign.name })).toBeVisible();
  await expect(page.getByText(campaign.description)).toBeVisible();
  
  // Click back link
  await page.locator('a[href="/campaigns"]').first().click();
  
  // Should be back on campaigns list
  await expect(page).toHaveURL('/campaigns');
});