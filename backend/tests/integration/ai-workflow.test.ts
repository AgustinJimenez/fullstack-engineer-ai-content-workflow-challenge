import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import {
  validCampaignData,
  contentPieceData,
  aiGenerationRequest,
  translationRequest,
  reviewData,
} from '../fixtures/campaigns';

const app = createApp();

describe('AI Workflow Integration Tests', () => {
  let campaignId: number;
  let contentId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean database and set up test data
    await sequelize.sync({ force: true });

    // Create test campaign
    const campaignResponse = await request(app)
      .post('/api/v1/campaigns')
      .send(validCampaignData);
    campaignId = campaignResponse.body.id;

    // Create test content piece
    const contentResponse = await request(app)
      .post('/api/v1/content')
      .send({ ...contentPieceData, campaignId });
    contentId = contentResponse.body.id;
  });

  describe('AI Content Generation', () => {
    it('should generate content with OpenAI', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ ...aiGenerationRequest, aiModel: 'openai' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        contentPieceId: contentId,
        aiModel: 'openai',
        modelVersion: 'gpt-4',
        promptUsed: aiGenerationRequest.prompt,
        generatedText: expect.any(String),
        metadata: expect.anything(),
        createdAt: expect.any(String),
      });

      // Verify generated text contains expected format
      expect(response.body.generatedText).toContain('AI-Generated:');
      expect(response.body.generatedText).toContain('Compelling & Engaging!');
    });

    it('should generate content with Anthropic', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ ...aiGenerationRequest, aiModel: 'anthropic' })
        .expect(201);

      expect(response.body).toMatchObject({
        aiModel: 'anthropic',
        modelVersion: 'claude-3',
        generatedText: expect.any(String),
      });
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate/99999')
        .send(aiGenerationRequest)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Content piece not found');
    });

    it('should require aiModel parameter', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Test prompt' }) // Missing aiModel
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('AI model is required');
    });

    it('should update content status after generation', async () => {
      // Generate AI content
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send(aiGenerationRequest)
        .expect(201);

      // Check that content status was updated
      const contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(contentResponse.body.status).toBe('ai_generated');
    });
  });

  describe('Content Translation', () => {
    it('should translate content to target language', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send(translationRequest)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        contentPieceId: contentId,
        targetLanguage: translationRequest.targetLanguage,
        translatedText: expect.any(String),
        aiModel: translationRequest.aiModel,
        status: 'completed',
        createdAt: expect.any(String),
      });

      // Verify translation format
      expect(response.body.translatedText).toContain(`[${translationRequest.targetLanguage.toUpperCase()} Translation]:`);
    });

    it('should require target language', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ aiModel: 'openai' }) // Missing targetLanguage
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Target language is required');
    });

    it('should default to openai model when not specified', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'fr' }) // Missing aiModel
        .expect(201);

      expect(response.body.aiModel).toBe('openai');
    });
  });

  describe('AI Generation History', () => {
    it('should retrieve all generations for content', async () => {
      // Generate multiple AI versions
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ ...aiGenerationRequest, aiModel: 'openai' });

      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ ...aiGenerationRequest, aiModel: 'anthropic' });

      const response = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        contentPieceId: contentId,
        aiModel: expect.any(String),
        generatedText: expect.any(String),
      });
    });

    it('should return empty array for content with no generations', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should order generations by creation date (newest first)', async () => {
      // Create generations with delay to ensure different timestamps
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ ...aiGenerationRequest, aiModel: 'openai' });

      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ ...aiGenerationRequest, aiModel: 'anthropic' });

      const response = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      
      // Verify ordering (newest first)
      const firstTimestamp = new Date(response.body.data[0].createdAt);
      const secondTimestamp = new Date(response.body[1].createdAt);
      expect(firstTimestamp.getTime()).toBeGreaterThan(secondTimestamp.getTime());
    });
  });

  describe('Content Review Workflow', () => {
    it('should create review and update content status', async () => {
      const reviewPayload = {
        ...reviewData,
        contentPieceId: contentId,
      };

      const response = await request(app)
        .post('/api/v1/content/reviews')
        .send(reviewPayload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        contentPieceId: contentId,
        reviewerName: reviewData.reviewerName,
        status: reviewData.status,
        feedback: reviewData.feedback,
      });

      // Verify content status was updated
      const contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(contentResponse.body.status).toBe('approved');
    });

    it('should handle different review statuses', async () => {
      const reviewStatuses = ['approved', 'rejected', 'needs_revision'];

      for (const status of reviewStatuses) {
        // Create new content for each test
        const newContentResponse = await request(app)
          .post('/api/v1/content')
          .send({ ...contentPieceData, campaignId });

        const newContentId = newContentResponse.body.id;

        await request(app)
          .post('/api/v1/content/reviews')
          .send({
            contentPieceId: newContentId,
            reviewerName: 'Test Reviewer',
            status,
            feedback: `Content is ${status}`,
          })
          .expect(201);

        // Check content status
        const contentResponse = await request(app)
          .get(`/api/v1/content/${newContentId}`)
          .expect(200);

        const expectedStatus = status === 'approved' ? 'approved' : 
                              status === 'rejected' ? 'rejected' : 'under_review';
        expect(contentResponse.body.status).toBe(expectedStatus);
      }
    });
  });

  describe('End-to-End AI Workflow', () => {
    it('should complete full workflow: create → generate → review → approve', async () => {
      // Step 1: Create campaign and content (already done in beforeEach)
      
      // Step 2: Generate AI content
      const generationResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send(aiGenerationRequest)
        .expect(201);

      expect(generationResponse.body.generatedText).toBeDefined();

      // Step 3: Verify content status updated to ai_generated
      let contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(contentResponse.body.status).toBe('ai_generated');

      // Step 4: Create review
      const reviewResponse = await request(app)
        .post('/api/v1/content/reviews')
        .send({
          contentPieceId: contentId,
          reviewerName: 'Quality Reviewer',
          status: 'approved',
          feedback: 'AI-generated content looks excellent!',
        })
        .expect(201);

      expect(reviewResponse.body.status).toBe('approved');

      // Step 5: Verify final content status
      contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(contentResponse.body.status).toBe('approved');

      // Step 6: Verify campaign includes the approved content
      const campaignResponse = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(campaignResponse.body.contentPieces).toHaveLength(1);
      expect(campaignResponse.body.contentPieces[0].status).toBe('approved');
    });

    it('should handle multi-language content workflow', async () => {
      // Generate AI content in English
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send(aiGenerationRequest);

      // Translate to Spanish
      const spanishTranslation = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'es', aiModel: 'openai' })
        .expect(201);

      // Translate to French
      const frenchTranslation = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'fr', aiModel: 'anthropic' })
        .expect(201);

      expect(spanishTranslation.body.translatedText).toContain('[ES Translation]:');
      expect(frenchTranslation.body.translatedText).toContain('[FR Translation]:');

      // Verify both translations are associated with the content
      const contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      // This would require implementing the translation relationship in the API
      // For now, we just verify the translations were created
      expect(spanishTranslation.body.contentPieceId).toBe(contentId);
      expect(frenchTranslation.body.contentPieceId).toBe(contentId);
    });
  });
});
