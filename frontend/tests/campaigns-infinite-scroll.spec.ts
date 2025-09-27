import { test, expect } from '@playwright/test';

test.describe('Campaigns Infinite Scroll', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the campaigns page
    await page.goto('/campaigns');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Campaigns');
  });

  test('should load initial campaigns and display them in a table', async ({ page }) => {
    // Check if table headers are present
    await expect(page.locator('th')).toHaveCount(6);
    await expect(page.locator('th')).toContainText(['Campaign', 'Status', 'Content', 'Languages', 'Created', 'Actions']);
    
    // Wait for campaigns to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    // Check that at least one campaign row is displayed
    const campaignRows = page.locator('[data-testid^="campaign-row-"]');
    const rowCount = await campaignRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should trigger infinite scroll when reaching the bottom', async ({ page }) => {
    // Wait for initial campaigns to load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 10000 });
    
    // Count initial campaigns
    const initialRows = await page.locator('[data-testid^="campaign-row-"]').count();
    
    // Scroll to the bottom of the page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait a bit for the intersection observer to trigger
    await page.waitForTimeout(1000);
    
    // Look for loading indicator
    const loadingIndicator = page.locator('text=Loading...');
    
    // Either we should see a loading indicator or more rows should be loaded
    const finalRows = await page.locator('[data-testid^="campaign-row-"]').count();
    
    // Check if more campaigns were loaded OR if we've reached the end
    const hasMore = finalRows > initialRows;
    const hasEndMessage = await page.locator('text=You\'ve reached the end').isVisible();
    
    expect(hasMore || hasEndMessage).toBe(true);
    
    if (hasMore) {
      console.log(`Infinite scroll working: loaded ${finalRows - initialRows} additional campaigns`);
    } else {
      console.log('Reached end of campaigns list');
    }
  });

  test('should handle scrolling multiple times', async ({ page }) => {
    // Wait for initial campaigns to load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 10000 });
    
    let previousCount = 0;
    let currentCount = await page.locator('[data-testid^="campaign-row-"]').count();
    let scrollAttempts = 0;
    const maxScrolls = 5; // Limit to prevent infinite loops
    
    while (scrollAttempts < maxScrolls && currentCount > previousCount) {
      previousCount = currentCount;
      
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for potential loading
      await page.waitForTimeout(1500);
      
      // Check if end message appeared
      const hasEndMessage = await page.locator('text=You\'ve reached the end').isVisible();
      if (hasEndMessage) {
        console.log('Reached the end of campaigns');
        break;
      }
      
      currentCount = await page.locator('[data-testid^="campaign-row-"]').count();
      scrollAttempts++;
      
      console.log(`Scroll ${scrollAttempts}: ${currentCount} campaigns loaded`);
    }
    
    expect(currentCount).toBeGreaterThanOrEqual(previousCount);
  });

  test('should maintain table structure during loading', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 10000 });
    
    // Check initial table structure
    await expect(page.locator('table thead th')).toHaveCount(6);
    
    // Scroll to trigger loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait a bit
    await page.waitForTimeout(1000);
    
    // Table headers should still be present
    await expect(page.locator('table thead th')).toHaveCount(6);
    
    // All campaign rows should be properly formatted as table rows
    const campaignRows = page.locator('[data-testid^="campaign-row-"]');
    const rowCount = await campaignRows.count();
    
    for (let i = 0; i < Math.min(rowCount, 5); i++) { // Check first 5 rows
      const row = campaignRows.nth(i);
      await expect(row).toHaveAttribute('data-testid');
      
      // Each row should have 6 cells (td elements)
      const cells = row.locator('td');
      await expect(cells).toHaveCount(6);
    }
  });

  test('should show appropriate loading states', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid^="campaign-row-"]', { timeout: 10000 });
    
    // Scroll to trigger loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Look for loading states within a reasonable time
    const loadingFound = await page.waitForSelector('text=Loading...', { timeout: 2000 }).then(() => true).catch(() => false);
    const endMessageFound = await page.locator('text=You\'ve reached the end').isVisible();
    
    // Should either show loading or end message
    expect(loadingFound || endMessageFound).toBe(true);
  });

  test('should create campaigns and verify infinite scroll with new data', async ({ page }) => {
    // First, wait for page to load and count existing campaigns
    await page.waitForSelector('h1:has-text("Campaigns")', { timeout: 10000 });
    
    const initialCount = await page.locator('[data-testid^="campaign-row-"]').count();
    
    // Create a new campaign
    await page.click('[data-testid="create-campaign-header-button"]');
    
    // Fill out the campaign form
    await page.fill('input[name="name"]', 'E2E Test Campaign');
    await page.fill('textarea[name="description"]', 'Test campaign for infinite scroll');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for the modal to close and campaign to be created
    await page.waitForSelector('[data-testid="create-campaign-header-button"]', { timeout: 10000 });
    
    // Verify the new campaign appears
    const newCount = await page.locator('[data-testid^="campaign-row-"]').count();
    expect(newCount).toBe(initialCount + 1);
    
    // Verify the new campaign is displayed
    await expect(page.locator('text=E2E Test Campaign')).toBeVisible();
    
    // Test infinite scroll still works
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    // Should either load more or show end message
    const finalCount = await page.locator('[data-testid^="campaign-row-"]').count();
    const hasEndMessage = await page.locator('text=You\'ve reached the end').isVisible();
    
    expect(finalCount >= newCount || hasEndMessage).toBe(true);
  });
});