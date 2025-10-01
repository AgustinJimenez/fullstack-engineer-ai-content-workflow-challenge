import { Page } from '@playwright/test';

/**
 * Wait for any loading overlays to disappear before interacting with the page
 */
export async function waitForPageReady(page: Page) {
  // Wait for loading overlay to disappear if present
  const loadingOverlay = page.locator('.absolute.inset-0.bg-white\\/80');
  if (await loadingOverlay.count() > 0) {
    await loadingOverlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Ignore timeout, continue anyway
    });
  }
  
  // Small delay to ensure page is stable
  await page.waitForTimeout(100);
}

/**
 * Click an element, waiting for any overlays to clear first
 */
export async function clickWhenReady(page: Page, selector: string) {
  await waitForPageReady(page);
  await page.click(selector);
}

/**
 * Wait for campaigns page to fully load with data
 */
export async function waitForCampaignsPageLoad(page: Page) {
  await page.goto('/campaigns');
  
  // Wait for either campaigns to load OR "no campaigns" message
  await Promise.race([
    page.waitForSelector('[data-campaign-card]', { timeout: 10000 }),
    page.waitForSelector('text=No campaigns found', { timeout: 10000 })
  ]).catch(() => {
    // If neither appears, that's okay - continue
  });
  
  await waitForPageReady(page);
}