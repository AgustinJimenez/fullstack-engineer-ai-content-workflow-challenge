import { test, expect } from '@playwright/test';

test('debug filters page', async ({ page }) => {
  const messages: string[] = [];
  
  page.on('console', msg => {
    messages.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    messages.push(`PAGE ERROR: ${error.message}`);
  });

  await page.goto('/campaigns');
  await page.waitForTimeout(5000);

  console.log('Console messages:');
  messages.forEach(m => console.log(m));

  const filterButton = page.getByTestId('toggle-filters-button');
  const isVisible = await filterButton.isVisible().catch(() => false);
  console.log('Filter button visible:', isVisible);

  const html = await page.content();
  console.log('Page includes CampaignFilters:', html.includes('toggle-filters-button'));
  console.log('Page includes Filters text:', html.includes('Filters'));
});