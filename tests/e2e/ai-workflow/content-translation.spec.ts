import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns, testContent } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should translate content to different languages', async ({ page }) => {
  // Setup: Create campaign and content via API
  const campaign = await apiHelpers.createCampaign(testCampaigns.valid);
  const content = await apiHelpers.createContent(campaign.id, testContent.cta);
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Wait for content to load and translate button to be available
  const card2 = page.locator(`[data-content-id=\"${content.id}\"]`);
  await card2.scrollIntoViewIfNeeded();
  await expect(card2).toBeVisible();
  
  // Wait for the content to fully load including the original content text
  await expect(card2.getByText(testContent.cta.originalContent)).toBeVisible();
  
  // Now click the translate button
  await expect(card2.getByTestId('translate-btn')).toBeVisible();
  await card2.getByTestId('translate-btn').click();
  
  // Wait for translation to complete (this would translate to Spanish by default)
  await page.waitForTimeout(2000);
  
  // Verify translation was created via API
  const translationResponse = await apiHelpers.request.post(`/api/v1/ai/translate/${content.id}`, {
    data: { targetLanguage: 'fr' }
  });
  
  expect(translationResponse.ok()).toBeTruthy();
  const translationData = await translationResponse.json();
  expect(translationData.targetLanguage).toBe('fr');
  expect(translationData.translatedText).toContain('[FR Translation]:');
});