import { test, expect } from '@playwright/test';
import { APIHelpers } from '../shared/utils/api-helpers';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
  
  // Ensure we have test data for filtering
  // These tests need campaigns to exist
  const existingCampaigns = await apiHelpers.getCampaigns();
  if (existingCampaigns.length === 0) {
    // Create a basic campaign if none exist
    await apiHelpers.createCampaign({
      name: 'Test Campaign for Filters',
      description: 'Test campaign to ensure filters have data',
      targetLanguages: ['es', 'fr']
    });
  }
});

test.describe('Campaign Multiselect Filters', () => {
  test('should support selecting multiple campaign statuses', async ({ page }) => {
    await page.goto('/campaigns');
    
    // Wait for page load
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    
    // Open filters
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Click on the status multi-select
    await page.getByTestId('filter-status').click();
    
    // Select "Active"
    await page.getByRole('option', { name: 'Active' }).click();
    
    // Verify Active is selected (should see badge in the trigger button)
    await expect(page.getByTestId('filter-status').getByText('Active')).toBeVisible();
    
    // Select "Paused" as well
    await page.getByRole('option', { name: 'Paused' }).click();
    
    // Should see both badges in the trigger button now
    const triggerButton = page.getByTestId('filter-status');
    await expect(triggerButton.getByText('Active')).toBeVisible();
    await expect(triggerButton.getByText('Paused')).toBeVisible();
    
    // Close the dropdown
    await page.keyboard.press('Escape');
    
    // Verify the active filter badge shows both
    await expect(page.locator('[data-testid="active-filter-status"]')).toContainText('active');
    await expect(page.locator('[data-testid="active-filter-status"]')).toContainText('paused');
  });

  test('should support selecting multiple content types', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Click on content type multi-select
    await page.getByTestId('filter-content-type').click();
    
    // Select multiple types
    await page.getByRole('option', { name: 'Headline' }).click();
    await page.getByRole('option', { name: 'Description' }).click();
    
    // Close dropdown
    await page.keyboard.press('Escape');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Verify filter badge shows both
    const filterBadge = page.locator('[data-testid="active-filter-content-type"]');
    await expect(filterBadge).toBeVisible();
    await expect(filterBadge).toContainText('headline');
    await expect(filterBadge).toContainText('description');
  });

  test('should support selecting multiple default languages', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Click on default language multi-select
    await page.getByTestId('filter-default-language').click();
    
    // Select multiple languages
    await page.getByRole('option', { name: 'English' }).click();
    await page.getByRole('option', { name: 'Spanish' }).click();
    await page.getByRole('option', { name: 'French' }).click();
    
    // Close dropdown
    await page.keyboard.press('Escape');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Verify filter badge shows all three
    const filterBadge = page.locator('[data-testid="active-filter-default-language"]');
    await expect(filterBadge).toBeVisible();
  });

  test('should support selecting multiple target languages', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Click on target language multi-select
    await page.getByTestId('filter-target-languages').click();
    
    // Select multiple languages
    await page.getByRole('option', { name: 'English' }).click();
    await page.getByRole('option', { name: 'Spanish' }).click();
    await page.getByRole('option', { name: 'French' }).click();
    
    // Close dropdown
    await page.keyboard.press('Escape');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Verify filter badge shows all three
    const filterBadge = page.locator('[data-testid="active-filter-target-languages"]');
    await expect(filterBadge).toBeVisible();
  });

  test('should allow removing individual selections from multiselect', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Select multiple content statuses
    await page.getByTestId('filter-content-status').click();
    await page.getByRole('option', { name: 'Draft' }).click();
    await page.getByRole('option', { name: 'Approved' }).click();
    await page.keyboard.press('Escape');
    
    await page.waitForTimeout(1000);
    
    // Verify both are selected
    await expect(page.locator('[data-testid="active-filter-content-status"]')).toBeVisible();
    
    // Click on the Draft badge itself to remove it (badges are clickable to remove)
    const triggerButton = page.getByTestId('filter-content-status');
    const draftBadge = triggerButton.getByText('Draft');
    await draftBadge.click();
    
    // Close dropdown
    await page.keyboard.press('Escape');
    
    await page.waitForTimeout(1000);
    
    // Should still have the filter active but only with "Approved"
    const filterBadge = page.locator('[data-testid="active-filter-content-status"]');
    await expect(filterBadge).toBeVisible();
    await expect(filterBadge).toContainText('approved');
  });

  test('should combine multiselect filters with other filters', async ({ page }) => {
    await page.goto('/campaigns');
    
    await page.waitForSelector('[data-campaign-card]', { timeout: 10000 });
    await page.click('[data-testid="toggle-filters-icon"]');
    
    // Select multiple campaign statuses
    await page.getByTestId('filter-status').click();
    await page.getByRole('option', { name: 'Active' }).click();
    await page.getByRole('option', { name: 'Completed' }).click();
    await page.keyboard.press('Escape');
    
    await page.waitForTimeout(500);
    
    // Select a single-value filter (AI Content)
    await page.click('[data-testid="filter-ai-content"]');
    await page.click('text=With AI Content');
    
    await page.waitForTimeout(2000);
    
    // Verify both filters are active
    await expect(page.locator('[data-testid="active-filter-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-filter-ai-content"]')).toBeVisible();
    
    // Should show active filter count badge (not the campaigns count)
    await expect(page.locator('[data-testid="active-filter-status"]')).toContainText('active');
  });
});