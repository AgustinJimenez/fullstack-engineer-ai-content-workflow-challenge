import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';
import { testCampaigns, analysisTestContent } from '../shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should show analysis results in ReviewModal', async ({ page }) => {
  // Setup: Create campaign, content, and analysis via API
  const campaign = await apiHelpers.createCampaign(testCampaigns.valid);
  const content = await apiHelpers.createContent(campaign.id, analysisTestContent.enthusiastic);
  
  // Generate AI content first to have something to review
  await apiHelpers.generateAIContent(content.id, {});
  
  // Generate analysis
  await apiHelpers.analyzeContent(content.id, {});
  
  // Update content status to under_review via API
  await apiHelpers.request.put(`${apiHelpers['baseURL']}/api/v1/content/${content.id}`, {
    data: { status: 'under_review' }
  });
  
  // Navigate to campaign detail page
  await page.goto(`/campaigns/${campaign.id}`);
  
  // Click Review Content button
  const card = page.locator(`[data-content-id="${content.id}"]`);
  await expect(card).toBeVisible();
  await card.getByText('Review Content').click();
  
  // Should show ReviewModal with analysis results
  // Target the modal dialog specifically to avoid conflicts
  const reviewModal = page.locator('[role="dialog"]');
  await expect(reviewModal.getByRole('heading', { name: 'Content Analysis' })).toBeVisible({ timeout: 5000 });
  
  // Target the analysis section within the modal (purple background)
  const analysisSection = reviewModal.locator('.bg-purple-50');
  await expect(analysisSection.getByText('Keywords:')).toBeVisible();
  await expect(analysisSection.getByText('Tone:', { exact: true })).toBeVisible();
  await expect(analysisSection.getByText('Sentiment:')).toBeVisible();
  await expect(analysisSection.getByText('Analysis Confidence:')).toBeVisible();
});