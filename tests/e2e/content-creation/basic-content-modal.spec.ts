import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';

let apiHelpers: APIHelpers;
const createdCampaignIds: number[] = [];
const createdContentIds: number[] = [];

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.afterEach(async () => {
  // Clean up content first
  for (const contentId of createdContentIds) {
    try {
      await apiHelpers.deleteContent(contentId);
    } catch (error) {
    }
  }

  // Then clean up campaigns
  for (const campaignId of createdCampaignIds) {
    try {
      await apiHelpers.deleteCampaign(campaignId);
    } catch (error) {
    }
  }

  createdCampaignIds.length = 0;
  createdContentIds.length = 0;
});

test('should create content through UI modal', async ({ page }) => {
  const campaign = await apiHelpers.createCampaign({
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    targetLanguages: ['es', 'fr']
  });
  createdCampaignIds.push(campaign.id);

  await page.goto(`/campaigns/${campaign.id}`);

  // Open content creation modal
  await page.getByRole('button', { name: 'Add Content' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Fill content details
  const originalContent = faker.company.catchPhrase();
  await page.getByLabel('Original Content *').fill(originalContent);

  // Content type should already be 'headline' by default
  const typeSelect = page.getByTestId('content-type-select');
  await typeSelect.click();
  await page.getByRole('option', { name: 'Headline' }).click();

  // Language should already be 'English' by default, but let's confirm
  const languageSelect = page.getByTestId('language-select');
  await languageSelect.click();
  await page.getByRole('option', { name: 'English' }).click();

  // Generate AI content first (required workflow)
  await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
  await page.getByRole('button', { name: 'Generate with AI' }).click();

  // Wait for generation to complete
  await expect(page.getByText('AI content generated').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();

  // Now save the content
  await page.getByRole('button', { name: 'Save Content' }).click();

  // Verify success toast and content appears
  await expect(page.getByText('Content saved successfully').first()).toBeVisible();
  await expect(page.getByTestId('content-card')).toBeVisible();
  await expect(page.getByText(originalContent).first()).toBeVisible();
});