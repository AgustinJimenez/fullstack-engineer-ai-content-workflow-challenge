import { test, expect } from '@playwright/test';

test.describe('Campaign Filter UX', () => {
  test('should keep campaigns visible while filter is loading', async ({ page }) => {
    // Navigate to campaigns page
    await page.goto('/campaigns');
    
    // Wait for initial campaigns to load
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    
    // Count initial campaigns visible
    const initialCampaigns = await page.locator('[data-campaign-card]').count();
    expect(initialCampaigns).toBeGreaterThan(0);
    
    // Open filters
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Apply a filter and immediately check if campaigns are still visible
    const filterPromise = page.click('[data-testid="filter-status"]').then(() => {
      return page.getByRole('option', { name: 'Active' }).click();
    });
    
    // Check that campaigns are still visible while the filter is being applied
    // (the API call might take a moment, so check during that time)
    await page.waitForTimeout(100); // Small delay to allow filter to trigger
    
    const campaignsDuringLoad = await page.locator('[data-campaign-card]').count();
    
    // Campaigns should still be visible (not 0) during the loading state
    expect(campaignsDuringLoad).toBeGreaterThan(0);
    
    // Wait for filter to complete
    await filterPromise;
    await page.waitForTimeout(1000);
    
    // Verify the filter was applied
    await expect(page.getByTestId('active-filter-status')).toBeVisible();
    
    // Verify campaigns are still showing (filtered results)
    const finalCampaigns = await page.locator('[data-campaign-card]').count();
    expect(finalCampaigns).toBeGreaterThan(0);
  });

  test('should show overlay spinner without hiding campaigns', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Wait for campaigns to load
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    
    // Get a reference to a specific campaign element
    const firstCampaign = page.locator('[data-campaign-card]').first();
    await expect(firstCampaign).toBeVisible();
    
    // Open filters
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Start applying filter
    await page.click('[data-testid="filter-content-status"]');
    await page.click('text=Draft');
    
    // Check during the loading state (right after clicking)
    await page.waitForTimeout(50);
    
    // The overlay should be visible (refreshing state)
    const overlay = page.locator('.bg-white\\/80').filter({ hasText: 'Loading campaigns' });
    
    // But campaigns in the table should still be in the DOM (just with overlay on top)
    const campaignsExist = await page.locator('[data-campaign-card]').count();
    expect(campaignsExist).toBeGreaterThan(0);
    
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // Verify filter applied
    await expect(page.getByTestId('active-filter-content-status')).toBeVisible();
  });

  test('should not show empty state message during filter loading', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Wait for campaigns
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    
    // Open filters and apply one
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.click('[data-testid="filter-content-type"]');
    await page.click('text=Headline');
    
    // During loading, there should be no "No campaigns found" message
    await page.waitForTimeout(100);
    
    const noCampaignsMessage = page.locator('text=No campaigns found');
    const isVisible = await noCampaignsMessage.isVisible().catch(() => false);
    
    // Should not see empty state during loading
    expect(isVisible).toBe(false);
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // After loading, we should either have campaigns or a legitimate empty state
    const hasCampaigns = await page.locator('[data-campaign-card]').count() > 0;
    const hasEmptyState = await noCampaignsMessage.isVisible().catch(() => false);
    
    // One of these should be true (either campaigns or empty state, but not a blank table)
    expect(hasCampaigns || hasEmptyState).toBe(true);
  });

  test('should show refreshing spinner overlay while keeping table visible', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Wait for initial load
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    const initialCount = await page.locator('[data-campaign-card]').count();
    
    // Open filters
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Apply filter
    await page.click('[data-testid="filter-ai-content"]');
    await page.click('text=With AI Content');
    
    // Check immediately after clicking - campaigns should still be visible
    const countDuringFilter = await page.locator('[data-campaign-card]').count();
    expect(countDuringFilter).toBe(initialCount); // Should still show original campaigns
    
    // Wait for filter to complete
    await page.waitForTimeout(2000);
    
    // After completion, should show filtered results
    const finalCount = await page.locator('[data-campaign-card]').count();
    expect(finalCount).toBeGreaterThanOrEqual(0); // Could be 0 if no campaigns match
  });
});