import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should handle content creation with different content types', async ({ page }) => {
  // Setup: Create campaign via API
  const campaign = await apiHelpers.createCampaign(testCampaigns.marketing);
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  const contentTypes = ['headline', 'description', 'body', 'cta', 'tagline'];
  
  for (const contentType of contentTypes) {
    // Click "Add Content" button
    await page.getByText('Add Content').click();
    
    // Select content type (shadcn Select)
    await page.getByTestId('content-type-select').click();
    // Map content types to their exact labels (based on ContentSetupStep.tsx)
    const contentTypeLabels: Record<string, string> = {
      'headline': 'Headline',
      'description': 'Description',
      'body': 'Body Content',
      'cta': 'Call to Action',
      'tagline': 'Tagline',
      'social_post': 'Social Media Post'
    };
    await page.getByRole('option', { name: contentTypeLabels[contentType] }).click();
    await page.getByLabel('Original Content *').fill(faker.lorem.sentence());
    
    // Generate AI content first (required workflow)
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    await page.getByPlaceholder('Customize your prompt...').fill('Generate compelling content');
    await page.getByRole('button', { name: 'Generate with AI' }).click();
    
    // Wait for generation and then save
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await page.getByRole('button', { name: 'Save Content' }).click();
    await page.waitForTimeout(1000);
    
    // Should show the content type (capitalized and with spaces)
    const displayName = contentType.charAt(0).toUpperCase() + contentType.slice(1).replace('_', ' ');
    // Newest content appears first
    const newCard = page.getByTestId('content-card').first();
    await expect(newCard).toBeVisible();
    await expect(newCard.getByTestId('content-type')).toHaveText(displayName);
  }
  
  // Should have created 5 content pieces
  const campaignData = await apiHelpers.getCampaign(campaign.id);
  expect(campaignData.contentPieces).toHaveLength(contentTypes.length);
});