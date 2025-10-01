import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should edit campaign through modal', async ({ page }) => {
  // Create campaign via API with target languages to avoid the disabled button issue
  const campaignData = {
    ...testCampaigns.valid,
    targetLanguages: ['es', 'fr'] // Add target languages to enable the Update button
  };
  const campaign = await apiHelpers.createCampaign(campaignData);
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Click edit button
  await page.getByText('Edit Campaign').click();
  
  // Should show edit modal with current values
  await expect(page.getByTestId('campaign-name-input')).toHaveValue(campaign.name);
  await expect(page.getByTestId('campaign-description-input')).toHaveValue(campaign.description);
  
  // Update the values
  const updatedName = faker.company.catchPhrase();
  const updatedDescription = faker.lorem.paragraph();
  
  await page.getByTestId('campaign-name-input').fill(updatedName);
  await page.getByTestId('campaign-description-input').fill(updatedDescription);
  // Select status (shadcn Select)
  await page.getByTestId('status-select').click();
  await page.getByRole('option', { name: 'Paused' }).click();
  
  // Target languages should already be set from the API creation, so the Update button should be enabled
  
  // Submit the form
  await page.getByRole('button', { name: 'Update Campaign' }).click();
  
  // Wait for modal to close and page to refresh
  await page.waitForTimeout(1000);
  
  // Should show updated values
  await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
  await expect(page.getByText(updatedDescription)).toBeVisible();
  await expect(page.getByText('paused')).toBeVisible();
  
  // Verify via API
  const updatedCampaign = await apiHelpers.getCampaign(campaign.id);
  expect(updatedCampaign.name).toBe(updatedName);
  expect(updatedCampaign.description).toBe(updatedDescription);
  expect(updatedCampaign.status).toBe('paused');
});