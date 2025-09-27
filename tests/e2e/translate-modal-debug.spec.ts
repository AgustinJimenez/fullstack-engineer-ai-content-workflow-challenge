import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIHelpers } from './shared/utils/api-helpers';
import { testCampaigns, testContent } from './shared/fixtures/test-data';

let apiHelpers: APIHelpers;

test.beforeEach(async ({ request }) => {
  apiHelpers = new APIHelpers(request);
});

test.describe('TranslateModal Language Count Debug', () => {
  test('should investigate campaign target languages setup', async ({ page, request }) => {
    // Create a campaign with EXACTLY 2 target languages
    const campaignData = {
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      targetLanguages: ['es', 'fr'] // EXACTLY Spanish and French
    };
    
    const campaign = await apiHelpers.createCampaign(campaignData);
    
    // Verify the created campaign actually has the right target languages
    const retrievedCampaign = await apiHelpers.getCampaign(campaign.id);
    
    // Check if the issue is in the campaign creation
    expect(Array.isArray(retrievedCampaign.targetLanguages)).toBe(true);
    expect(retrievedCampaign.targetLanguages).toHaveLength(2);
    expect(retrievedCampaign.targetLanguages).toContain('es');
    expect(retrievedCampaign.targetLanguages).toContain('fr');
    
  });
});