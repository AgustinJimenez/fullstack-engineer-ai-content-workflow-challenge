import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should handle content expansion/collapse', async ({ page }) => {
  // Setup: Create campaign and content with long text via API
  const campaign = await apiHelpers.createCampaign(testCampaigns.valid);
  const longContent = `${faker.lorem.paragraph()} ${faker.lorem.paragraph()} ${faker.lorem.paragraph()} ${faker.lorem.paragraph()} ${faker.lorem.paragraph()}`;
  
  await apiHelpers.createContent(campaign.id, {
    type: 'body',
    originalContent: longContent,
    language: 'en',
  });
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Should show truncated content
  await expect(page.getByTestId('content-card')).toBeVisible();
  
  // Should show "Show more" button if content is long
  const lastLongCard = page.getByTestId('content-card').first();
  await lastLongCard.scrollIntoViewIfNeeded();
  await expect(lastLongCard).toBeVisible();
  const showMoreButton = lastLongCard.getByTestId('show-more-btn');
  if (await showMoreButton.isVisible()) {
    await showMoreButton.click();
    
    // Should show full content
    await expect(lastLongCard.getByText(longContent)).toBeVisible();
    
    // Should show "Show less" button
    const showLessBtn = lastLongCard.getByTestId('show-more-btn');
    await expect(showLessBtn).toBeVisible();
    
    // Click "Show less" (force to avoid overlay intercepts)
    await showLessBtn.click({ force: true });
    
    // Should show truncated content again
    await expect(lastLongCard.getByTestId('show-more-btn')).toBeVisible();
  }
});