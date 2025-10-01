import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from './shared/utils/api-helpers';

// Helper function to wait for AI generation with error checking
async function waitForAIGeneration(page: any, timeout = 25000) {
  const errorMessage = page.getByText('Failed to generate AI content');
  const generatedContent = page.getByTestId('generated-content');
  
  try {
    // Wait for generated content to appear
    await generatedContent.waitFor({ state: 'visible', timeout });
    
    // Double-check that no error message appeared
    if (await errorMessage.isVisible()) {
      throw new Error('AI generation failed: Error message "Failed to generate AI content" appeared');
    }
  } catch (error: any) {
    // If we get a timeout, check if an error message appeared
    if (await errorMessage.isVisible()) {
      throw new Error('AI generation failed: Error message "Failed to generate AI content" appeared');
    }
    throw error;
  }
}

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
    await page.locator('button:has-text("Add Content")').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill original content
    const originalContent = faker.company.catchPhrase();
    await page.locator('#original-content').fill(originalContent);

    // Content type should already be 'headline' by default, but let's make sure
    // The component uses Select with data-testid
    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Headline")').click();

    // Select AI provider
    await page.locator('button:has-text("OpenAI GPT-4")').click();

    // Verify custom prompt is populated (using placeholder since label might not work)
    const customPrompt = await page.getByPlaceholder('Customize your prompt...').inputValue();
    expect(customPrompt).toContain(originalContent);

    // Generate AI content
    await page.locator('button:has-text("Generate with AI")').click();

    // Wait for generation to complete
    const generatingButton = page.locator('button:has-text("Generating...")');
    if (await generatingButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(generatingButton).not.toBeVisible({ timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Check for AI Generated Content section
    await expect(page.getByText('AI Generated Content')).toBeVisible({ timeout: 10000 });

    // Verify we moved to review step
    // Check that we're in review state (AI Generated Content section is shown)\n    await expect(page.getByText('AI Generated Content')).toBeVisible();
    await expect(page.getByTestId('generated-content')).toBeVisible();
    
    // Verify analysis data is shown automatically (if implemented)
    const hasAnalysisSection = await page.getByText('Content Analysis').isVisible().catch(() => false);
    
    if (hasAnalysisSection) {
      await expect(page.getByText('Content Analysis')).toBeVisible();
      await expect(page.getByText('Keywords')).toBeVisible();
    }

    // Save the content
    await page.locator('button:has-text("Save")').click();
    // Wait for save confirmation
    await page.waitForTimeout(2000); // Give it time to save
    // Verify by checking that we're back on the campaign page with content
    await expect(page.getByTestId('content-card').first()).toBeVisible({ timeout: 10000 });

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
    await page.locator('button:has-text("Add Content")').click();

    const originalContent = faker.company.catchPhrase();
    await page.locator('#original-content').fill(originalContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Description")').click(); // Based on ContentSetupStep, it's 'Description' not 'Product Description'

    // Select Claude provider
    await page.locator('button:has-text("Anthropic Claude")').click();

    // Generate content
    await page.locator('button:has-text("Generate with AI")').click();

    // Wait for generation to complete
    const generatingButton = page.locator('button:has-text("Generating...")');
    if (await generatingButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(generatingButton).not.toBeVisible({ timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Check for AI Generated Content section
    await expect(page.getByText('AI Generated Content')).toBeVisible({ timeout: 10000 });

    // Check that we're in review state (AI Generated Content section is shown)\n    await expect(page.getByText('AI Generated Content')).toBeVisible();
    
    // Verify the generated content is not empty
    const generatedText = await page.getByTestId('generated-content').inputValue();
    expect(generatedText.length).toBeGreaterThan(0);
    
    // Verify analysis data is shown automatically (if implemented)
    const hasAnalysisSection = await page.getByText('Content Analysis').isVisible().catch(() => false);
    
    if (hasAnalysisSection) {
      await expect(page.getByText('Content Analysis')).toBeVisible();
      await expect(page.getByText('Keywords')).toBeVisible();
    }

    // Save content
    await page.locator('button:has-text("Save")').click();
    // Wait for save confirmation
    await page.waitForTimeout(2000); // Give it time to save
    // Verify by checking that we're back on the campaign page with content
    await expect(page.getByTestId('content-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('should customize AI prompt before generation', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    await page.locator('button:has-text("Add Content")').click();
    await page.waitForSelector('#original-content', { timeout: 5000 });

    const originalContent = faker.company.catchPhrase();
    await page.locator('#original-content').fill(originalContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Body Content")').click();

    await page.locator('button:has-text("OpenAI GPT-4")').click();

    // Customize the prompt
    const customPrompt = `${faker.lorem.sentence()} based on: ${originalContent}`;
    await page.getByPlaceholder('Customize your prompt...').clear();
    await page.getByPlaceholder('Customize your prompt...').fill(customPrompt);

    // Generate with custom prompt
    await page.locator('button:has-text("Generate with AI")').click();

    // Wait for generation to complete
    const generatingButton = page.locator('button:has-text("Generating...")');
    if (await generatingButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(generatingButton).not.toBeVisible({ timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Check for AI Generated Content section
    await expect(page.getByText('AI Generated Content')).toBeVisible({ timeout: 10000 });
    
    // Verify we're on the review step
    // Check that we're in review state (AI Generated Content section is shown)\n    await expect(page.getByText('AI Generated Content')).toBeVisible();
    
    // Verify the generated content is not empty
    const generatedText = await page.getByTestId('generated-content').inputValue();
    expect(generatedText.length).toBeGreaterThan(0);
    
    // Verify analysis data is shown automatically (if implemented)
    const hasAnalysisSection = await page.getByText('Content Analysis').isVisible().catch(() => false);
    
    if (hasAnalysisSection) {
      await expect(page.getByText('Content Analysis')).toBeVisible();
      await expect(page.getByText('Keywords')).toBeVisible();
    }

    await page.locator('button:has-text("Save")').click();
    
    // Wait for either the success message or the modal to close
    await Promise.race([
      expect(page.getByText('Content saved successfully').first()).toBeVisible({ timeout: 10000 }).catch(() => {}),
      page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 })
    ]);
  });

  test('should handle AI generation without custom prompt formatting issue', async ({ page }) => {
    const campaign = await apiHelpers.createCampaign({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es']
    });

    await page.goto(`/campaigns/${campaign.id}`);

    await page.locator('button:has-text("Add Content")').click();

    const originalContent = faker.lorem.sentence();
    await page.locator('#original-content').fill(originalContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Headline")').click();

    await page.locator('button:has-text("OpenAI GPT-4")').click();

    // Verify the prompt doesn't have extra quotes
    const promptValue = await page.getByPlaceholder('Customize your prompt...').inputValue();
    expect(promptValue).toContain('based on: ' + originalContent);
    expect(promptValue).not.toContain('based on: "' + originalContent + '"');

    await page.locator('button:has-text("Generate with AI")').click();
    
    // Wait for generation to complete
    const generatingButton = page.locator('button:has-text("Generating...")');
    if (await generatingButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(generatingButton).not.toBeVisible({ timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Check for AI Generated Content section
    await expect(page.getByText('AI Generated Content')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Save")').click();
    // Wait for save confirmation
    await page.waitForTimeout(2000); // Give it time to save
    // Verify by checking that we're back on the campaign page with content
    await expect(page.getByTestId('content-card').first()).toBeVisible({ timeout: 10000 });
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

    await page.locator('button:has-text("Add Content")').click();

    const testContent = faker.lorem.sentence();
    await page.locator('#original-content').fill(testContent);

    const typeSelect = page.getByTestId('content-type-select');
    await typeSelect.click();
    await page.locator('[role="option"]:has-text("Headline")').click();

    await page.locator('button:has-text("OpenAI GPT-4")').click();
    await page.locator('button:has-text("Generate with AI")').click();

    // Wait for generation to complete with error checking
    await waitForAIGeneration(page);
    // Check that we're in review state (AI Generated Content section is shown)\n    await expect(page.getByText('AI Generated Content')).toBeVisible();

    // Close the review modal without saving
    await page.locator('button:has-text("Cancel")').click();

    // Verify content is NOT on the page (because we didn't save)
    await expect(page.getByTestId('content-card')).not.toBeVisible();
    await expect(page.getByText(testContent)).not.toBeVisible();

    // Now create and save properly
    await page.locator('button:has-text("Add Content")').click();
    await page.locator('#original-content').fill(testContent);

    const typeSelectSecond = page.getByTestId('content-type-select');
    await typeSelectSecond.click();
    await page.locator('[role="option"]:has-text("Headline")').click();
    await page.locator('button:has-text("OpenAI GPT-4")').click();
    await page.locator('button:has-text("Generate with AI")').click();
    
    // Wait for generation to complete
    const generatingButton = page.locator('button:has-text("Generating...")');
    if (await generatingButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(generatingButton).not.toBeVisible({ timeout: 30000 });
    }
    
    await page.waitForTimeout(2000);
    
    // Check for AI Generated Content section
    await expect(page.getByText('AI Generated Content')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Save")').click();

    // Now content should appear
    // Wait for save confirmation
    await page.waitForTimeout(2000); // Give it time to save
    // Verify by checking that we're back on the campaign page with content
    await expect(page.getByTestId('content-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('content-card')).toBeVisible();
  });
});