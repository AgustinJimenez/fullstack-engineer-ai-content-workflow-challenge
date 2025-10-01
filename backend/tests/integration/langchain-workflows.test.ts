import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { Campaign } from '../../src/models/Campaign';
import { ContentPiece } from '../../src/models/ContentPiece';

describe('LangChain Workflows Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    app = await createApp();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/langchain/smart-workflow', () => {
    it('should execute smart workflow with fake AI', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          content: 'Test product launch',
          contentType: 'headline',
          targetLanguages: ['es', 'fr'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('original', 'Test product launch');
      expect(response.body).toHaveProperty('generated');
      expect(response.body).toHaveProperty('analysis');
      expect(response.body.analysis).toHaveProperty('keywords');
      expect(response.body.analysis).toHaveProperty('tone');
      expect(response.body.analysis).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('translations');
      expect(response.body.translations).toHaveProperty('es');
      expect(response.body.translations).toHaveProperty('fr');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata.workflow).toBe('generate → analyze → translate');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          contentType: 'headline',
          targetLanguages: ['es'],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Content is required');
    });

    it('should validate target languages', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          content: 'Test content',
          contentType: 'headline',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Target languages array is required');
    });

    it('should support multiple target languages', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          content: 'Global campaign content',
          contentType: 'description',
          targetLanguages: ['es', 'fr', 'de', 'it'],
        })
        .expect(200);

      expect(Object.keys(response.body.translations)).toHaveLength(4);
      expect(response.body.translations).toHaveProperty('es');
      expect(response.body.translations).toHaveProperty('fr');
      expect(response.body.translations).toHaveProperty('de');
      expect(response.body.translations).toHaveProperty('it');
    });
  });

  describe('POST /api/v1/langchain/enhancement-chain', () => {
    it('should execute enhancement chain with fake AI', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/enhancement-chain')
        .send({
          content: 'Basic product description',
          contentType: 'description',
        })
        .expect(200);

      expect(response.body).toHaveProperty('original', 'Basic product description');
      expect(response.body).toHaveProperty('enhanced');
      expect(response.body).toHaveProperty('refined');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata.workflow).toBe('enhance → refine → summarize');
      expect(response.body.metadata.steps).toBe(3);
    });

    it('should validate required content', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/enhancement-chain')
        .send({
          contentType: 'description',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Content is required');
    });

    it('should work with different content types', async () => {
      const contentTypes = ['headline', 'description', 'body_content', 'cta'];

      for (const type of contentTypes) {
        const response = await request(app)
          .post('/api/v1/langchain/enhancement-chain')
          .send({
            content: `Test ${type} content`,
            contentType: type,
          })
          .expect(200);

        expect(response.body.metadata.workflow).toBe('enhance → refine → summarize');
      }
    });
  });

  describe('POST /api/v1/langchain/multi-language', () => {
    it('should translate to multiple languages in parallel', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/multi-language')
        .send({
          content: 'Welcome to our platform',
          targetLanguages: ['es', 'fr', 'de'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('original', 'Welcome to our platform');
      expect(response.body).toHaveProperty('translations');
      expect(response.body.translations).toHaveProperty('es');
      expect(response.body.translations.es).toHaveProperty('text');
      expect(response.body.translations.es).toHaveProperty('quality');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary.languagesProcessed).toBe(3);
      expect(response.body.metadata.workflow).toBe('parallel multi-language translation');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/multi-language')
        .send({
          targetLanguages: ['es'],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Content is required');
    });

    it('should handle large number of target languages', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/multi-language')
        .send({
          content: 'Global reach content',
          targetLanguages: ['es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko'],
        })
        .expect(200);

      expect(response.body.summary.languagesProcessed).toBe(8);
      expect(Object.keys(response.body.translations)).toHaveLength(8);
    });
  });

  describe('POST /api/v1/langchain/content/:contentId/workflow', () => {
    let campaign: any;
    let content: any;

    beforeEach(async () => {
      campaign = await Campaign.create({
        name: 'Test Campaign',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: ['es', 'fr'],
      });

      content = await ContentPiece.create({
        campaignId: campaign.id,
        type: 'headline',
        originalContent: 'Test content',
        status: 'draft',
      });
    });

    it('should execute workflow for existing content', async () => {
      const response = await request(app)
        .post(`/api/v1/langchain/content/${content.id}/workflow`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('contentId', content.id);
      expect(response.body).toHaveProperty('original');
      expect(response.body).toHaveProperty('generated');
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('translations');
      expect(response.body.translations).toHaveProperty('es');
      expect(response.body.translations).toHaveProperty('fr');
    });

    it('should use campaign target languages by default', async () => {
      const response = await request(app)
        .post(`/api/v1/langchain/content/${content.id}/workflow`)
        .send({})
        .expect(200);

      // Should use campaign's target languages ['es', 'fr']
      expect(Object.keys(response.body.translations)).toHaveLength(2);
      expect(response.body.translations).toHaveProperty('es');
      expect(response.body.translations).toHaveProperty('fr');
    });

    it('should allow overriding target languages', async () => {
      const response = await request(app)
        .post(`/api/v1/langchain/content/${content.id}/workflow`)
        .send({
          targetLanguages: ['de', 'it', 'pt'],
        })
        .expect(200);

      expect(Object.keys(response.body.translations)).toHaveLength(3);
      expect(response.body.translations).toHaveProperty('de');
      expect(response.body.translations).toHaveProperty('it');
      expect(response.body.translations).toHaveProperty('pt');
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/content/99999/workflow')
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Content piece not found');
    });

    it('should save workflow results to content metadata', async () => {
      await request(app)
        .post(`/api/v1/langchain/content/${content.id}/workflow`)
        .send({})
        .expect(200);

      // Reload content from database
      await content.reload();

      expect(content.metadata).toHaveProperty('langchainWorkflow');
      expect(content.metadata.langchainWorkflow).toHaveProperty('executedAt');
      expect(content.metadata.langchainWorkflow).toHaveProperty('analysis');
      expect(content.metadata.langchainWorkflow).toHaveProperty('translations');
    });
  });

  describe('Workflow Performance', () => {
    it('should complete smart workflow within reasonable time', async () => {
      const start = Date.now();

      await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          content: 'Performance test content',
          contentType: 'headline',
          targetLanguages: ['es', 'fr'],
        })
        .expect(200);

      const duration = Date.now() - start;

      // With fake AI, should be very fast (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent workflow requests', async () => {
      const requests = Array(5).fill(null).map((_, i) =>
        request(app)
          .post('/api/v1/langchain/smart-workflow')
          .send({
            content: `Concurrent test ${i}`,
            contentType: 'headline',
            targetLanguages: ['es'],
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('generated');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid content type gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          content: 'Test',
          contentType: 'invalid_type',
          targetLanguages: ['es'],
        })
        .expect(200); // Should still work, just uses default

      expect(response.body).toHaveProperty('generated');
    });

    it('should handle empty target languages array', async () => {
      const response = await request(app)
        .post('/api/v1/langchain/smart-workflow')
        .send({
          content: 'Test',
          contentType: 'headline',
          targetLanguages: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(5000);

      const response = await request(app)
        .post('/api/v1/langchain/enhancement-chain')
        .send({
          content: longContent,
          contentType: 'body_content',
        })
        .expect(200);

      expect(response.body).toHaveProperty('enhanced');
    });
  });
});