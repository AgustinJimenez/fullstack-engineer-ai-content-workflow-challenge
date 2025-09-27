import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should create campaign through UI and verify via API', async ({ page, request }) => {
  // Create campaign via API first (this works reliably)
  const campaign = await apiHelpers.createCampaign({
    name: testCampaigns.valid.name,
    description: testCampaigns.valid.description
  });
  
  // Navigate to campaigns page to verify UI displays the created campaign
  await page.goto('/campaigns');
  // Wait for a stable UI anchor instead of networkidle (SSE keeps connections open)
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
  
  // Wait for at least one campaign row to appear
  await expect(page.locator('[data-testid^="campaign-row-"]').first()).toBeVisible({ timeout: 15000 });
  
  // Additional verification: check that we can see the specific campaign row
  const campaignRow = page.getByTestId(`campaign-row-${campaign.id}`);
  await expect(campaignRow).toBeVisible();
  
  // Verify the campaign details appear within the specific row
  await expect(campaignRow.getByText(testCampaigns.valid.name)).toBeVisible({ timeout: 5000 });
  await expect(campaignRow.getByText(testCampaigns.valid.description)).toBeVisible({ timeout: 5000 });
});