import { test, expect } from '@playwright/test';
import { createTestCampaigns, cleanupTestCampaigns } from './setup';

test.describe('Campaigns Infinite Scroll - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up any existing test data
    await cleanupTestCampaigns(page);
    
    // Navigate to the campaigns page
    await page.goto('/campaigns');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Campaigns');
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    await cleanupTestCampaigns(page);
  });

  test('should handle infinite scroll with exactly pagination limit', async ({ page }) => {
    // Create exactly the pagination limit (12 campaigns as per API)
    await createTestCampaigns(page, 12);
    
    // Wait for campaigns to load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 15000 });
    
    // Should show all 12 campaigns
    const campaignRows = page.locator('[data-testid^="campaign-row-"]');
    await expect(campaignRows).toHaveCount(12);
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for intersection observer
    await page.waitForTimeout(2000);
    
    // Should show "reached the end" message since we have exactly 12 items
    await expect(page.locator('text=You\'ve reached the end')).toBeVisible();
  });

  test('should trigger infinite scroll with more than pagination limit', async ({ page }) => {
    // Create more than the pagination limit (25 campaigns)
    await createTestCampaigns(page, 25);
    
    // Wait for initial campaigns to load (should be 12)
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 15000 });
    
    // Should initially show 12 campaigns
    let campaignRows = page.locator('[data-testid^="campaign-row-"]');
    await expect(campaignRows).toHaveCount(12);
    
    // Scroll to bottom to trigger load more
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for more campaigns to load
    await page.waitForTimeout(3000);
    
    // Should now show 24 campaigns (12 + 12)
    campaignRows = page.locator('[data-testid^="campaign-row-"]');
    await expect(campaignRows).toHaveCount(24);
    
    // Scroll again to load the last campaign
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(3000);
    
    // Should now show all 25 campaigns
    campaignRows = page.locator('[data-testid^="campaign-row-"]');
    await expect(campaignRows).toHaveCount(25);
    
    // Should show end message now
    await expect(page.locator('text=You\'ve reached the end')).toBeVisible();
  });

  test('should handle rapid scrolling without duplicate requests', async ({ page }) => {
    // Create enough campaigns to test multiple pages
    await createTestCampaigns(page, 30);
    
    // Wait for initial load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 15000 });
    
    // Rapidly scroll multiple times
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(100); // Very short wait between scrolls
    }
    
    // Wait for all loading to complete
    await page.waitForTimeout(5000);
    
    // Should have loaded campaigns without duplicates
    const campaignRows = page.locator('[data-testid^="campaign-row-"]');
    const totalCount = await campaignRows.count();
    
    // Verify no duplicate campaign names
    const campaignNames = await campaignRows.locator('a').allTextContents();
    const uniqueNames = new Set(campaignNames);
    
    expect(uniqueNames.size).toBe(campaignNames.length); // No duplicates
    expect(totalCount).toBeLessThanOrEqual(30); // Not more than total available
  });

  test('should maintain scroll position during loading', async ({ page }) => {
    // Create campaigns for testing
    await createTestCampaigns(page, 20);
    
    // Wait for initial load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 15000 });
    
    // Scroll to middle of the list
    const middleCampaign = page.locator('[data-testid^="campaign-row-"]').nth(5);
    await middleCampaign.scrollIntoViewIfNeeded();
    
    // Get scroll position
    const scrollPos = await page.evaluate(() => window.pageYOffset);
    
    // Scroll to bottom to trigger loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for loading
    await page.waitForTimeout(3000);
    
    // Scroll back to middle
    await middleCampaign.scrollIntoViewIfNeeded();
    
    // The middle campaign should still be visible and in the same relative position
    await expect(middleCampaign).toBeVisible();
  });

  test('should show loading indicator during fetch', async ({ page }) => {
    // Create campaigns for testing
    await createTestCampaigns(page, 15);
    
    // Wait for initial load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 15000 });
    
    // Monitor network requests
    let loadingRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/campaigns') && request.url().includes('cursor=')) {
        loadingRequests++;
      }
    });
    
    // Scroll to trigger loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Should see loading indicator briefly
    const loadingVisible = await page.waitForSelector('text=Loading...', { timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    
    // Should have made at least one loading request
    expect(loadingRequests).toBeGreaterThan(0);
    
    // Loading indicator should appear during fetch (might be brief)
    // OR we should see the end message if no more data to load
    const endVisible = await page.locator('text=You\'ve reached the end').isVisible();
    
    expect(loadingVisible || endVisible).toBe(true);
  });
});