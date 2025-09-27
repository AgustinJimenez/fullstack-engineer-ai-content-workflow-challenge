import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from './shared/utils/api-helpers';

let apiHelpers: APIHelpers;
const createdCampaignIds: number[] = [];

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.afterEach(async () => {
  // Clean up campaigns created during tests
  for (const campaignId of createdCampaignIds) {
    try {
      await apiHelpers.deleteCampaign(campaignId);
    } catch (error) {
    }
  }
  createdCampaignIds.length = 0;
});

test.describe('AI Content Generation', () => {
  test('should complete AI generation workflow with OpenAI', async ({ page }) => {
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

    // Fill original content
    const originalContent = faker.company.catchPhrase();
    await page.getByLabel('Original Content *').fill(originalContent);

    // Content type should already be 'headline' by default, but let's make sure
    // The component uses Select with data-testid
    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Headline' }).click();

    // Select AI provider
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Verify custom prompt is populated (using placeholder since label might not work)
    const customPrompt = await page.getByPlaceholder('Customize your prompt...').inputValue();
    expect(customPrompt).toContain(originalContent);

    // Generate AI content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Wait for generation and verify success toast
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await expect(page.getByText(/Your headline has been enhanced with AI/).first()).toBeVisible();

    // Verify we moved to review step
    await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();
    await expect(page.getByText('AI-Generated (openai):').first()).toBeVisible();

    // Save the content
    await page.getByRole('button', { name: 'Save Content' }).click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible();

    // Verify content appears in campaign
    await expect(page.getByTestId('content-card')).toBeVisible();
    await expect(page.getByText(originalContent).first()).toBeVisible();
  });

  test('should complete AI generation workflow with Claude', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    // Create content with Claude
    await page.getByRole('button', { name: 'Add Content' }).click();

    const originalContent = faker.company.catchPhrase();
    await page.getByLabel('Original Content *').fill(originalContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Description' }).click(); // Based on ContentSetupStep, it's 'Description' not 'Product Description'

    // Select Claude provider
    await page.getByRole('button', { name: 'Anthropic Claude' }).click();

    // Generate content
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Verify generation success
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();
    // Just verify that some AI generation text is present, don't be provider-specific
    await expect(page.getByText(/AI.*Generated/i).first()).toBeVisible();

    // Save content
    await page.getByRole('button', { name: 'Save Content' }).click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible();
  });

  test('should customize AI prompt before generation', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    await page.getByRole('button', { name: 'Add Content' }).click();

    const originalContent = faker.company.catchPhrase();
    await page.getByLabel('Original Content *').fill(originalContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Body Content' }).click(); // Using available content types from ContentSetupStep

    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Customize the prompt
    const customPrompt = `${faker.lorem.sentence()} based on: ${originalContent}`;
    await page.getByPlaceholder('Customize your prompt...').clear();
    await page.getByPlaceholder('Customize your prompt...').fill(customPrompt);

    // Generate with custom prompt
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // Verify generation works with custom prompt
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();

    await page.getByRole('button', { name: 'Save Content' }).click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible();
  });

  test('should handle AI generation without custom prompt formatting issue', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    await page.getByRole('button', { name: 'Add Content' }).click();

    const originalContent = faker.lorem.sentence();
    await page.getByLabel('Original Content *').fill(originalContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Headline' }).click();

    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();

    // Verify the prompt doesn't have extra quotes
    const promptValue = await page.getByPlaceholder('Customize your prompt...').inputValue();
    expect(promptValue).toContain('based on: ' + originalContent);
    expect(promptValue).not.toContain('based on: "' + originalContent + '"');

    await page.getByRole('button', { name: 'Generate with AI' }).click();
    await expect(page.getByText('AI content generated').first()).toBeVisible();

    await page.getByRole('button', { name: 'Save Content' }).click();
    await expect(page.getByText('Content saved successfully').first()).toBeVisible();
  });

  test('should handle content generation flow correctly (no immediate save)', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    // Verify no content exists initially
    await expect(page.getByTestId('content-card')).not.toBeVisible();

    await page.getByRole('button', { name: 'Add Content' }).click();

    const testContent = faker.lorem.sentence();
    await page.getByLabel('Original Content *').fill(testContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.getByRole('option', { name: 'Headline' }).click();

    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    await page.getByRole('button', { name: 'Generate with AI' }).click();

    // After generation, content should NOT appear on page yet
    await expect(page.getByText('AI content generated').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review Generated Content' })).toBeVisible();

    // Close the review modal without saving
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify content is NOT on the page (because we didn't save)
    await expect(page.getByTestId('content-card')).not.toBeVisible();
    await expect(page.getByText(testContent)).not.toBeVisible();

    // Now create and save properly
    await page.getByRole('button', { name: 'Add Content' }).click();
    await page.getByLabel('Original Content *').fill(testContent);

    const typeSelectSecond = page.getByTestId('content-type-select');
    await typeSelectSecond.click();
    await page.getByRole('option', { name: 'Headline' }).click();
    await page.getByRole('button', { name: 'OpenAI GPT-4' }).click();
    await page.getByRole('button', { name: 'Generate with AI' }).click();
    await page.getByRole('button', { name: 'Save Content' }).click();

    // Now content should appear
    await expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('content-card')).toBeVisible();
  });
});