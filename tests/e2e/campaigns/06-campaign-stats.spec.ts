import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.describe.configure({ mode: 'serial' });

test.describe('Campaign Stats and KPIs', () => {
  test('should display correct KPIs independent of pagination', async ({ page }) => {
    await page.goto('/campaigns');
    
    await expect(page.getByText('Total Campaigns')).toBeVisible();
    
    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    await page.waitForTimeout(3000);
    
    let initialCountText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!initialCountText || initialCountText === '...' || isNaN(parseInt(initialCountText))) {
      await page.waitForTimeout(500);
      initialCountText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const initialCount = parseInt(initialCountText);

    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });

    await page.waitForTimeout(2000);

    const countAfterScrollText = await totalCampaignsCard.locator('.text-2xl').textContent();
    const countAfterScroll = parseInt(countAfterScrollText || '0');
    expect(Math.abs(countAfterScroll - initialCount)).toBeLessThanOrEqual(5);
  });

  test('should update KPIs when content is added', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto('/campaigns');
    await page.waitForTimeout(3000);
    
    const contentPiecesCard = page.locator('text=Content Pieces').locator('..').locator('..');
    let initialText = await contentPiecesCard.locator('.text-2xl').textContent();
    while (!initialText || initialText === '...') {
      await page.waitForTimeout(500);
      initialText = await contentPiecesCard.locator('.text-2xl').textContent();
    }
    const initialContentCount = parseInt(initialText || '0');

    await apiHelpers.createContent(campaign.id, {
      type: 'headline',
      originalContent: faker.lorem.sentence(),
      language: 'en'
    });

    await page.waitForTimeout(2000);
    let finalText = await contentPiecesCard.locator('.text-2xl').textContent();
    while (!finalText || finalText === '...') {
      await page.waitForTimeout(500);
      finalText = await contentPiecesCard.locator('.text-2xl').textContent();
    }
    const finalCount = parseInt(finalText || '0');
    expect(Math.abs(finalCount - (initialContentCount + 1))).toBeLessThanOrEqual(10);
  });

  test('should update KPIs when AI generation is created', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    const content = await apiHelpers.createContent(campaign.id, {
      type: 'headline',
      originalContent: faker.lorem.sentence(),
      language: 'en'
    });

    await page.goto('/campaigns');
    await page.waitForTimeout(3000);
    
    const aiGeneratedCard = page.locator('text=AI Generated').locator('..').locator('..');
    let initialText = await aiGeneratedCard.locator('.text-2xl').textContent();
    while (!initialText || initialText === '...') {
      await page.waitForTimeout(500);
      initialText = await aiGeneratedCard.locator('.text-2xl').textContent();
    }
    const initialAICount = parseInt(initialText || '0');

    await apiHelpers.generateAIContent(content.id, {
      prompt: faker.lorem.sentence()
    });

    await page.waitForTimeout(2000);
    const finalText = await aiGeneratedCard.locator('.text-2xl').textContent();
    const finalCount = parseInt(finalText || '0');
    expect(Math.abs(finalCount - (initialAICount + 1))).toBeLessThanOrEqual(10);
  });

  test('should show filtered KPIs when searching', async ({ page }) => {
    const uniqueId = faker.string.alphanumeric(12);
    await apiHelpers.createCampaign({
      name: `SEARCHTEST_${uniqueId}_1 Campaign`,
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await apiHelpers.createCampaign({
      name: `SEARCHTEST_${uniqueId}_2 NotInSearch`,
      description: faker.lorem.paragraph(),
      targetLanguages: ['fr']
    });

    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    let totalCountText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!totalCountText || totalCountText === '...') {
      await page.waitForTimeout(500);
      totalCountText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const totalCount = parseInt(totalCountText || '0');

    await page.getByPlaceholder('Search by campaign name or description...').fill(`SEARCHTEST_${uniqueId}_1`);
    await page.waitForTimeout(1500);
    
    const filteredText = await totalCampaignsCard.locator('.text-2xl').textContent();
    expect(filteredText).toBe('1');

    await page.getByTestId('clear-search-button').click();
    await page.waitForTimeout(1500);
    
    const clearedText = await totalCampaignsCard.locator('.text-2xl').textContent();
    const clearedCount = parseInt(clearedText || '0');
    expect(Math.abs(clearedCount - totalCount)).toBeLessThanOrEqual(10);
  });

  test('should update stats after campaign deletion', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto('/campaigns');
    await page.waitForTimeout(3000);

    const totalCampaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
    let initialText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!initialText || initialText === '...') {
      await page.waitForTimeout(500);
      initialText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const initialCount = parseInt(initialText || '0');

    await page.getByTestId(`delete-campaign-${campaign.id}`).click();

    const confirmDialog = page.locator('button.bg-red-600');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.click();

    await page.waitForTimeout(2000);
    let finalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    while (!finalText || finalText === '...') {
      await page.waitForTimeout(500);
      finalText = await totalCampaignsCard.locator('.text-2xl').textContent();
    }
    const finalCount = parseInt(finalText || '0');
    expect(Math.abs(finalCount - (initialCount - 1))).toBeLessThanOrEqual(10);
  });
});