import { test, expect } from '@playwright/test';

test.describe('Campaign Filter Performance', () => {
  test('contentStatus filter should complete within 10 seconds', async ({ page }) => {
    // Navigate to campaigns page
    await page.goto('/campaigns');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    // Start timing
    const startTime = Date.now();
    
    // Open filters
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Select contentStatus filter
    await page.click('[data-testid="filter-content-status"]');
    await page.click('text=Draft');
    
    // Wait for results to load (either campaigns appear or "no results" message)
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    // Check timing
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`ContentStatus filter took ${duration}ms`);
    
    // Should complete within 10 seconds (10000ms)
    expect(duration).toBeLessThan(10000);
    
    // Verify filter is applied
    const activeFilter = page.locator('[data-testid="active-filter-content-status"]');
    await expect(activeFilter).toBeVisible();
  });

  test('contentType filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.click('[data-testid="filter-content-type"]');
    await page.click('text=Headline');
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`ContentType filter took ${duration}ms`);
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-content-type"]');
    await expect(activeFilter).toBeVisible();
  });

  test('AI content filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.click('[data-testid="filter-ai-content"]');
    await page.click('text=With AI Content');
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`AI content filter took ${duration}ms`);
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-ai-content"]');
    await expect(activeFilter).toBeVisible();
  });

  test('translations filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.click('[data-testid="filter-translations"]');
    await page.click('text=With Translations');
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Translations filter took ${duration}ms`);
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-translations"]');
    await expect(activeFilter).toBeVisible();
  });

  test('language filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.click('[data-testid="filter-language"]');
    await page.click('text=Spanish');
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Language filter took ${duration}ms`);
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-language"]');
    await expect(activeFilter).toBeVisible();
  });

  test('campaign status filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.click('[data-testid="filter-status"]');
    await page.getByRole('option', { name: 'Active' }).click();
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Campaign status filter took ${duration}ms`);
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-status"]');
    await expect(activeFilter).toBeVisible();
  });
});