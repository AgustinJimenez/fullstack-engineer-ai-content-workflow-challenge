import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test('should handle form validation errors', async ({ page }) => {
  await page.goto('/campaigns');
  
  // Open create modal
  const hasEmptyState = await page.getByTestId('create-campaign-empty-state-button').isVisible();
  if (hasEmptyState) {
    const emptyBtn = page.getByTestId('create-campaign-empty-state-button');
    await emptyBtn.scrollIntoViewIfNeeded();
    try { await emptyBtn.click({ force: true }); } catch {}
    await emptyBtn.dispatchEvent('click');
  } else {
    const headerBtn = page.getByTestId('create-campaign-header-button');
    await headerBtn.scrollIntoViewIfNeeded();
    try { await headerBtn.click({ force: true }); } catch {}
    await headerBtn.dispatchEvent('click');
  }
  
  // Try to submit empty form - button should be disabled (no name and no target languages)
  const submitButton = page.getByTestId('submit-campaign-button');
  await expect(submitButton).toBeDisabled();
  
  // Should show validation error (HTML5 validation)
  const nameInput = page.getByTestId('campaign-name-input');
  await expect(nameInput).toHaveAttribute('required');
  
  // Fill name but leave description empty (should work, but need target language for button to be enabled)
  await nameInput.fill(faker.company.catchPhrase());
  
  // Verify that button is still disabled without target language
  const submitButtonAfterName = page.getByTestId('submit-campaign-button');
  await expect(submitButtonAfterName).toBeDisabled();
  
  // Close modal to clean up test (we verified the validation behavior)
  await page.keyboard.press('Escape');
  
  // This test successfully verified form validation behavior:
  // 1. Empty form has disabled button
  // 2. Name field is required
  // 3. Button remains disabled without target language selection
});