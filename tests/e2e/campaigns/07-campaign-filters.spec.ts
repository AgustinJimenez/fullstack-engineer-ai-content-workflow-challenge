import { test, expect } from '@playwright/test';

test.describe('Campaign Filters', () => {
  test('should filter campaigns by status and update KPIs', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    await page.getByTestId('toggle-filters-icon').click();
    
    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    let totalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!totalText || totalText === '...') {
      await page.waitForTimeout(500);
      totalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const totalCount = parseInt(totalText || '0');

    await page.getByTestId('filter-status').click();
    await page.getByRole('option', { name: 'Active' }).click();
    await page.waitForTimeout(2000);

    let activeText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!activeText || activeText === '...') {
      await page.waitForTimeout(500);
      activeText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const activeCount = parseInt(activeText || '0');

    expect(activeCount).toBeGreaterThan(0);
    expect(activeCount).toBeLessThanOrEqual(totalCount);

    await expect(page.getByTestId('active-filter-status')).toBeVisible();

    await page.getByTestId('active-filter-status').click();
    await page.waitForTimeout(2000);

    // Wait for stats to refresh
    let clearedText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!clearedText || clearedText === '...') {
      await page.waitForTimeout(500);
      clearedText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const clearedCount = parseInt(clearedText || '0');
    
    // After clearing, count should be >= active count (may have changed slightly)
    expect(clearedCount).toBeGreaterThanOrEqual(activeCount);
  });

  test('should filter campaigns by content review status', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    await page.getByTestId('toggle-filters-icon').click();

    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    let totalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!totalText || totalText === '...') {
      await page.waitForTimeout(500);
      totalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const totalCount = parseInt(totalText || '0');
    
    await page.getByTestId('filter-content-status').click();
    await page.getByRole('option', { name: 'Approved' }).click();
    await page.waitForTimeout(2000);

    let approvedText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!approvedText || approvedText === '...') {
      await page.waitForTimeout(500);
      approvedText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const approvedCount = parseInt(approvedText || '0');

    expect(approvedCount).toBeGreaterThan(0);
    expect(approvedCount).toBeLessThanOrEqual(totalCount);

    await expect(page.getByTestId('active-filter-content-status')).toBeVisible();
  });

  test('should filter campaigns by content type', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    await page.getByTestId('toggle-filters-icon').click();
    
    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    
    await page.getByTestId('filter-content-type').click();
    await page.getByRole('option', { name: 'Headline' }).click();
    await page.waitForTimeout(2000);

    let filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!filteredText || filteredText === '...') {
      await page.waitForTimeout(500);
      filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const filteredCount = parseInt(filteredText || '0');

    expect(filteredCount).toBeGreaterThan(0);
    await expect(page.getByTestId('active-filter-content-type')).toBeVisible();
  });

  test('should filter campaigns with AI content', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    await page.getByTestId('toggle-filters-icon').click();
    
    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    
    await page.getByTestId('filter-ai-content').click();
    await page.getByRole('option', { name: 'With AI Content' }).click();
    await page.waitForTimeout(2000);

    let filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!filteredText || filteredText === '...') {
      await page.waitForTimeout(500);
      filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const filteredCount = parseInt(filteredText || '0');

    expect(filteredCount).toBeGreaterThan(0);
    await expect(page.getByTestId('active-filter-ai-content')).toBeVisible();
  });

  test('should filter campaigns by language', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    await page.getByTestId('toggle-filters-icon').click();
    
    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    let totalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!totalText || totalText === '...') {
      await page.waitForTimeout(500);
      totalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const totalCount = parseInt(totalText || '0');
    
    await page.getByTestId('filter-language').click();
    await page.getByRole('option', { name: 'Spanish' }).click();
    await page.waitForTimeout(2000);

    let filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!filteredText || filteredText === '...') {
      await page.waitForTimeout(500);
      filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const filteredCount = parseInt(filteredText || '0');

    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    await expect(page.getByTestId('active-filter-language')).toBeVisible();
  });

  test('should show active filter badges and allow removal', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(2000);

    await page.getByTestId('toggle-filters-icon').click();
    
    await page.getByTestId('filter-status').click();
    await page.getByRole('option', { name: 'Active' }).click();

    await expect(page.getByTestId('active-filter-status')).toBeVisible();
    await expect(page.getByText('1 active')).toBeVisible();

    await page.getByTestId('active-filter-status').click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('active-filter-status')).not.toBeVisible();
  });

  test('should update KPIs based on active filters', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    const approvedCard = page.locator('text=Approved').locator('..').locator('..');
    await page.waitForTimeout(1500);
    let initialApprovedText = await approvedCard.locator('.text-2xl').textContent();
    while (!initialApprovedText || initialApprovedText === '...') {
      await page.waitForTimeout(500);
      initialApprovedText = await approvedCard.locator('.text-2xl').textContent();
    }
    const initialApproved = parseInt(initialApprovedText || '0');

    await page.getByTestId('toggle-filters-icon').click();
    await page.getByTestId('filter-content-status').click();
    await page.getByRole('option', { name: 'Approved' }).click();
    await page.waitForTimeout(2000);
    
    let filteredApprovedText = await approvedCard.locator('.text-2xl').textContent();
    while (!filteredApprovedText || filteredApprovedText === '...') {
      await page.waitForTimeout(500);
      filteredApprovedText = await approvedCard.locator('.text-2xl').textContent();
    }
    const filteredApproved = parseInt(filteredApprovedText || '0');

    expect(filteredApproved).toBeGreaterThan(0);
    expect(filteredApproved).toBeLessThanOrEqual(initialApproved);
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    let initialText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!initialText || initialText === '...') {
      await page.waitForTimeout(500);
      initialText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const initialCount = parseInt(initialText || '0');

    await page.getByTestId('toggle-filters-icon').click();
    
    await page.getByTestId('filter-status').click();
    await page.getByRole('option', { name: 'Active' }).click();
    await page.waitForTimeout(1000);

    await page.getByTestId('filter-ai-content').click();
    await page.getByRole('option', { name: 'With AI Content' }).click();
    await page.waitForTimeout(2000);

    let filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!filteredText || filteredText === '...') {
      await page.waitForTimeout(500);
      filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const filteredCount = parseInt(filteredText || '0');

    expect(filteredCount).toBeGreaterThan(0);
    // With multiple filters, count should be <= initial (may be equal due to data changes during test)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await expect(page.getByText('2 active')).toBeVisible();
    await expect(page.getByTestId('active-filter-status')).toBeVisible();
    await expect(page.getByTestId('active-filter-ai-content')).toBeVisible();

    await page.getByTestId('clear-all-filters-button').click();
    await page.waitForTimeout(1500);

    await expect(page.getByTestId('active-filter-status')).not.toBeVisible();
    await expect(page.getByText('2 active')).not.toBeVisible();
  });
});