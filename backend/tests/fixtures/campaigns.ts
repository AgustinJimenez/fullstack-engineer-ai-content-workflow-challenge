export const validCampaignData = {
  name: 'Test Campaign',
  description: 'A test campaign for integration testing',
};

export const invalidCampaignData = {
  name: '', // Invalid: empty name
  description: 'Campaign with invalid name',
};

export const updateCampaignData = {
  name: 'Updated Campaign Name',
  description: 'Updated description',
  status: 'paused',
};

export const contentPieceData = {
  type: 'headline',
  originalContent: 'Test headline content',
  language: 'en',
};

export const aiGenerationRequest = {
  aiModel: 'openai',
  prompt: 'Generate compelling content for this test',
};

export const translationRequest = {
  targetLanguage: 'es',
  aiModel: 'openai',
};

export const reviewData = {
  reviewerName: 'Test Reviewer',
  status: 'approved',
  feedback: 'Looks great!',
};