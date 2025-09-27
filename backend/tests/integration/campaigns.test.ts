import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { validCampaignData, invalidCampaignData, updateCampaignData } from '../fixtures/campaigns';
import { Express } from 'express';

let app: Express;

describe('Campaign API Integration Tests', () => {
  beforeAll(async () => {
    app = await createApp();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean database between tests
    await sequelize.sync({ force: true });
  });

  describe('POST /api/v1/campaigns', () => {
    it('should create a new campaign with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: validCampaignData.name,
        description: validCampaignData.description,
        status: 'active',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 400 for invalid campaign data', async () => {
      const response = await request(app)
        .post('/api/v1/campaigns')
        .send(invalidCampaignData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Name is required');
    });

    it('should handle missing request body', async () => {
      await request(app)
        .post('/api/v1/campaigns')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/campaigns', () => {
    it('should return empty array when no campaigns exist', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all campaigns with content pieces', async () => {
      // Create test campaign
      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      const response = await request(app)
        .get('/api/v1/campaigns')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: createResponse.body.id,
        name: validCampaignData.name,
        description: validCampaignData.description,
        contentPieces: expect.any(Array),
      });
    });
  });

  describe('GET /api/v1/campaigns/:id', () => {
    it('should return campaign by ID with related data', async () => {
      // Create test campaign
      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      const campaignId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: campaignId,
        name: validCampaignData.name,
        description: validCampaignData.description,
        contentPieces: expect.any(Array),
      });
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Campaign not found');
    });

    it('should return 400 for invalid campaign ID', async () => {
      await request(app)
        .get('/api/v1/campaigns/invalid-id')
        .expect(400);
    });
  });

  describe('PUT /api/v1/campaigns/:id', () => {
    it('should update existing campaign', async () => {
      // Create test campaign
      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      const campaignId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .send(updateCampaignData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: campaignId,
        name: updateCampaignData.name,
        description: updateCampaignData.description,
        status: updateCampaignData.status,
      });
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await request(app)
        .put('/api/v1/campaigns/99999')
        .send(updateCampaignData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should allow partial updates', async () => {
      // Create test campaign
      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      const campaignId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .send({ name: 'Only Name Updated' })
        .expect(200);

      expect(response.body.name).toBe('Only Name Updated');
      expect(response.body.description).toBe(validCampaignData.description);
    });
  });

  describe('DELETE /api/v1/campaigns/:id', () => {
    it('should delete existing campaign', async () => {
      // Create test campaign
      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      const campaignId = createResponse.body.id;

      await request(app)
        .delete(`/api/v1/campaigns/${campaignId}`)
        .expect(204);

      // Verify campaign is deleted
      await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(404);
    });

    it('should return 404 for non-existent campaign', async () => {
      await request(app)
        .delete('/api/v1/campaigns/99999')
        .expect(404);
    });
  });

  describe('GET /api/v1/campaigns/stats', () => {
    it('should return zero stats when no campaigns exist', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns/stats')
        .expect(200);

      expect(response.body).toEqual({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalContentPieces: 0,
        contentWithAI: 0,
        contentUnderReview: 0,
        approvedContent: 0,
        totalTranslations: 0,
      });
    });

    it('should return correct stats with campaigns but no content', async () => {
      await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      await request(app)
        .post('/api/v1/campaigns')
        .send({ ...validCampaignData, name: 'Campaign 2', status: 'paused' });

      const response = await request(app)
        .get('/api/v1/campaigns/stats')
        .expect(200);

      expect(response.body).toEqual({
        totalCampaigns: 2,
        activeCampaigns: 1,
        totalContentPieces: 0,
        contentWithAI: 0,
        contentUnderReview: 0,
        approvedContent: 0,
        totalTranslations: 0,
      });
    });

    it('should return correct stats with content and AI generations', async () => {
      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);
      const campaignId = campaignResponse.body.id;

      const contentResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/content`)
        .send({
          type: 'headline',
          originalContent: 'Test content',
          language: 'en',
        });
      const contentId = contentResponse.body.id;

      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Test prompt' });

      await request(app)
        .put(`/api/v1/content/${contentId}`)
        .send({ status: 'under_review' });

      const response = await request(app)
        .get('/api/v1/campaigns/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        totalCampaigns: 1,
        activeCampaigns: 1,
        totalContentPieces: 1,
        contentWithAI: 1,
        contentUnderReview: 1,
        approvedContent: 0,
      });
    });

    it('should count translations correctly', async () => {
      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send({ ...validCampaignData, targetLanguages: ['es', 'fr'] });
      const campaignId = campaignResponse.body.id;

      const contentResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/content`)
        .send({
          type: 'headline',
          originalContent: 'Test content',
          language: 'en',
        });
      const contentId = contentResponse.body.id;

      await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'es' });

      await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'fr' });

      const response = await request(app)
        .get('/api/v1/campaigns/stats')
        .expect(200);

      expect(response.body.totalTranslations).toBe(2);
    });

    it('should aggregate stats across multiple campaigns', async () => {
      const campaign1 = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);

      const campaign2 = await request(app)
        .post('/api/v1/campaigns')
        .send({ ...validCampaignData, name: 'Campaign 2' });

      await request(app)
        .post(`/api/v1/campaigns/${campaign1.body.id}/content`)
        .send({ type: 'headline', originalContent: 'Content 1', language: 'en' });

      await request(app)
        .post(`/api/v1/campaigns/${campaign1.body.id}/content`)
        .send({ type: 'description', originalContent: 'Content 2', language: 'en' });

      await request(app)
        .post(`/api/v1/campaigns/${campaign2.body.id}/content`)
        .send({ type: 'cta', originalContent: 'Content 3', language: 'en' });

      const response = await request(app)
        .get('/api/v1/campaigns/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        totalCampaigns: 2,
        activeCampaigns: 2,
        totalContentPieces: 3,
      });
    });
  });

  describe('Campaign Content Integration', () => {
    let campaignId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/v1/campaigns')
        .send(validCampaignData);
      campaignId = createResponse.body.id;
    });

    it('should add content to campaign', async () => {
      const contentData = {
        type: 'headline',
        originalContent: 'Test headline',
        language: 'en',
      };

      const response = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/content`)
        .send(contentData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        campaignId: campaignId,
        type: contentData.type,
        originalContent: contentData.originalContent,
        language: contentData.language,
        status: 'draft',
      });
    });

    it('should get campaign content', async () => {
      const contentData = {
        type: 'headline',
        originalContent: 'Test headline',
        language: 'en',
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/content`)
        .send(contentData);

      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}/content`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        campaignId: campaignId,
        type: contentData.type,
        originalContent: contentData.originalContent,
      });
    });
  });
});
