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
    await page.getByRole('option', { name: 'Draft' }).click();
    await page.keyboard.press('Escape'); // Close dropdown
    
    // Wait for results to load (either campaigns appear or "no results" message)
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    // Check timing
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    
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
    await page.getByRole('option', { name: 'Headline' }).click();
    await page.keyboard.press('Escape'); // Close dropdown
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
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
    
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-translations"]');
    await expect(activeFilter).toBeVisible();
  });

  test('defaultLanguage filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.locator('button:has-text("All languages")').first().click();
    await page.click('text=Spanish');
    await page.keyboard.press('Escape');
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-default-language"]');
    await expect(activeFilter).toBeVisible();
  });

  test('targetLanguages filter should complete within 10 seconds', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-testid="toggle-filters-icon"]');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="toggle-filters-icon"]');
    await page.locator('button:has-text("All languages")').nth(1).click();
    await page.click('text=Spanish');
    await page.keyboard.press('Escape');
    
    await Promise.race([
      page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
      page.waitForSelector('text=No campaigns found', { timeout: 10000 })
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-target-languages"]');
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
    
    expect(duration).toBeLessThan(10000);
    
    const activeFilter = page.locator('[data-testid="active-filter-status"]');
    await expect(activeFilter).toBeVisible();
  });
});