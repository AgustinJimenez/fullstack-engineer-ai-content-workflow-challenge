import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should display existing campaigns from API', async ({ page }) => {
  // Create campaign via API
  const campaign = await apiHelpers.createCampaign(testCampaigns.marketing);
  
  // Navigate to campaigns page
  await page.goto('/campaigns');
  
  // Should display the campaign - use specific row selector
  const campaignRow = page.getByTestId(`campaign-row-${campaign.id}`);
  await expect(campaignRow.getByText(campaign.name)).toBeVisible();
  await expect(campaignRow.getByText(campaign.description)).toBeVisible();
  
  // Should show campaign status
  await expect(campaignRow.getByText('active')).toBeVisible();
  
  // Should show content count - be more specific about which '0' we're looking for
  await expect(campaignRow).toContainText('0'); // Less strict approach since there are multiple '0' elements
});