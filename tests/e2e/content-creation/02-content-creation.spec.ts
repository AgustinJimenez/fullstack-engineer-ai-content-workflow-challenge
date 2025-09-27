import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from '../shared/utils/api-helpers';

let apiHelpers: APIHelpers;
const createdCampaignIds: number[] = [];
const createdContentIds: number[] = [];

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.afterEach(async () => {
  // Clean up content first
  for (const contentId of createdContentIds) {
    try {
      await apiHelpers.deleteContent(contentId);
    } catch (error) {
    }
  }

  // Then clean up campaigns
  for (const campaignId of createdCampaignIds) {
    try {
      await apiHelpers.deleteCampaign(campaignId);
    } catch (error) {
    }
  }

  createdCampaignIds.length = 0;
  createdContentIds.length = 0;
});

test.describe('Content Creation Workflow', () => {
  test('should create content through UI modal', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es', 'fr']
    });
    createdCampaignIds.push(campaign.id);

    await page.goto(`/campaigns/${campaign.id}`);

    // Open content creation modal
    await page.getByRole('button', { name: 'Add Content' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill content details
    const originalContent = faker.company.catchPhrase();
    await page.getByLabel('Original Content *').fill(originalContent);

    // Content type should already be 'headline' by default
    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Headline' }).click();

    // Language should already be 'English' by default, but let's confirm
    const languageSelect = page.getByTestId('language-select');
    await languageSelect.click();
    await page.getByRole('option', { name: 'English' }).click();

    // Generate AI content first (required workflow)
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation to complete
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();

    // Now save the content
    await page.getByRole('button', { name: 'Save Content' }).click();

    // Verify success toast and content appears
    await expect(page.getByText('Content saved successfully').first()).toBeVisible();
    await expect(page.getByTestId('content-card')).toBeVisible();
    await expect(page.getByText(originalContent).first()).toBeVisible();
  });

  test('should validate content creation form', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });
    createdCampaignIds.push(campaign.id);

    await page.goto(`/campaigns/${campaign.id}`);
    await page.getByRole('button', { name: 'Add Content' }).click();

    // Try to save with empty original content (but AI button should be disabled)
    const generateButton = page.getByRole('button', { name: 'Generate with AI' });
    await expect(generateButton).toBeDisabled();

    // Fill original content
    await page.getByLabel('Original Content *').fill(faker.lorem.sentence());

    // Now the generate button should be enabled
    await expect(generateButton).toBeEnabled();

    // The workflow requires AI generation before saving
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    await generateButton.click();

    // Wait for generation
    await expect(page.getByText('AI content generated').first()).toBeVisible();

    // Now save the content
    await page.getByRole('button', { name: 'Save Content' }).click();

    // Should succeed
    await expect(page.getByText('Content saved successfully').first()).toBeVisible();
  });

  test('should support all content types', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });
    createdCampaignIds.push(campaign.id);

    await page.goto(`/campaigns/${campaign.id}`);

    const contentTypes = [
      { type: 'Headline', content: faker.company.catchPhrase() },
      { type: 'Description', content: faker.lorem.paragraph() },
      { type: 'Body Content', content: faker.lorem.sentences(3) },
      { type: 'Social Media Post', content: faker.lorem.sentence() }
    ];

    // Create each content type
    for (const { type, content } of contentTypes) {
      await page.getByRole('button', { name: 'Add Content' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByLabel('Original Content *').fill(content);

      const typeSelect = page.getByTestId('content-type-select');
      await typeSelect.click();
      await page.getByRole('option', { name: type }).click();

      // Generate AI content first (required workflow)
      await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
      await page.getByPlaceholder('Customize your prompt...').fill('Generate compelling content for this campaign');
      await page.getByRole('button', { name: 'Generate with AI' }).click();

      // Wait for generation and save
      await expect(page.getByText('AI content generated').first()).toBeVisible();
      await page.getByRole('button', { name: 'Save Content' }).click();
      await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 15000 });

      // Verify content appears (using first() since there might be multiple)
      await expect(page.getByText(content).first()).toBeVisible();
    }

    // Verify all content cards are present
    const contentCards = await page.getByTestId('content-card').count();
    expect(contentCards).toBe(4);
  });

  test('should delete content with confirmation', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    const contentText = faker.lorem.sentence();
    const content = await apiHelpers.createContent(campaign.id, {
      type: 'headline',
      originalContent: contentText,
      language: 'en'
    });

    await page.goto(`/campaigns/${campaign.id}`);

    // Find and delete the content
    const contentCard = page.getByTestId('content-card');
    await contentCard.getByTestId('delete-content-button').click();

    // Confirm deletion - check for the actual modal title and description
    await expect(page.getByText('Delete Content Piece')).toBeVisible();
    await expect(page.getByText('This will permanently delete this content piece')).toBeVisible();
    // Click the delete button in the modal (the second one)
    await page.getByRole('button', { name: 'Delete' }).nth(1).click();

    // Verify deletion
    await expect(page.getByText('Content deleted').first()).toBeVisible();
    await expect(page.getByText(contentText)).not.toBeVisible();
    await expect(page.getByTestId('content-card')).not.toBeVisible();
  });

  test('should cancel content deletion', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    const contentText = faker.lorem.sentence();
    const content = await apiHelpers.createContent(campaign.id, {
      type: 'headline',
      originalContent: contentText,
      language: 'en'
    });

    await page.goto(`/campaigns/${campaign.id}`);

    // Start delete process
    const contentCard = page.getByTestId('content-card');
    await contentCard.getByTestId('delete-content-button').click();

    // Cancel deletion
    await expect(page.getByText('Delete Content Piece')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify content still exists
    await expect(page.getByText(contentText)).toBeVisible();
    await expect(page.getByTestId('content-card')).toBeVisible();
  });

  test('should display content metadata correctly', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es', 'fr']
    });

    const contentText = faker.lorem.paragraph();
    const content = await apiHelpers.createContent(campaign.id, {
      type: 'product_description',
      originalContent: contentText,
      language: 'en'
    });

    await page.goto(`/campaigns/${campaign.id}`);

    const contentCard = page.getByTestId('content-card');

    // Verify content type is displayed
    await expect(contentCard.getByTestId('content-type')).toBeVisible();

    // Verify original language is displayed (part of "EN • date" format)
    await expect(contentCard.getByText(/EN/)).toBeVisible();

    // Verify content text is displayed (may be truncated, so check for first part)
    const firstWords = contentText.split(' ').slice(0, 5).join(' ');
    await expect(contentCard.getByText(new RegExp(firstWords.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeVisible();
  });

  test('should handle content with special characters', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    const specialContent = `${faker.lorem.sentence()} áéíóú ñüÿ €£¥ "quotes" & symbols!`;

    // Create content with special characters
    await page.getByRole('button', { name: 'Add Content' }).click();
    await page.getByLabel('Original Content *').fill(specialContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Headline' }).click();

    // Generate AI content first (required workflow)
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    await page.getByPlaceholder('Customize your prompt...').fill('Generate compelling content');
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation and then save
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await page.getByRole('button', { name: 'Save Content' }).click();

    // Verify special characters are preserved
    await expect(page.getByText('Content saved').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(specialContent).first()).toBeVisible();
  });
});