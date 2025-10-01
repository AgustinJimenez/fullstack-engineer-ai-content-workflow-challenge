import request from 'supertest';
import { createApp } from '../../src/app';
import { Campaign } from '../../src/models/Campaign';
import { ContentPiece } from '../../src/models/ContentPiece';
import { sequelize } from '../../src/config/database';
import { Express } from 'express';

let app: Express;

describe('AI Comparison API', () => {
  let campaign: Campaign;
  let contentPiece: ContentPiece;

  beforeAll(async () => {
    app = await createApp();
    
    // Ensure database is synced
    await sequelize.sync({ force: true });

    campaign = await Campaign.create({
      name: 'Test Campaign',
      description: 'Test Description',
      defaultLanguage: 'en',
      targetLanguages: ['es', 'fr'],
      status: 'active',
    });

    contentPiece = await ContentPiece.create({
      campaignId: campaign.id,
      type: 'body_content',
      originalContent: 'Original content for testing',
      language: 'en',
      status: 'draft',
    });
  });

  afterAll(async () => {
    // Cleanup is handled by global test setup
  });

  describe('POST /api/v1/ai/compare/:contentId', () => {
    it('should compare AI models successfully with fake AI enabled', async () => {
      // Ensure fake AI is enabled for testing
      process.env.NODE_ENV = 'test';

      const response = await request(app)
        .post(`/api/v1/ai/compare/${contentPiece.id}`)
        .send({
          prompt: 'Generate compelling marketing content',
          models: ['openai', 'anthropic']
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            provider: 'openai',
            text: expect.any(String),
            analysis: expect.objectContaining({
              keywords: expect.any(Array),
              tone: expect.any(String),
              sentiment: expect.objectContaining({
                label: expect.any(String),
                score: expect.any(Number)
              })
            }),
            executionTime: expect.any(Number)
          }),
          expect.objectContaining({
            provider: 'anthropic',
            text: expect.any(String),
            analysis: expect.objectContaining({
              keywords: expect.any(Array),
              tone: expect.any(String),
              sentiment: expect.objectContaining({
                label: expect.any(String),
                score: expect.any(Number)
              })
            }),
            executionTime: expect.any(Number)
          })
        ]),
        summary: expect.objectContaining({
          totalModels: 2,
          fastestModel: expect.any(String),
          longestContent: expect.any(String)
        })
      });

      // Verify both models returned content
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].text).toBeTruthy();
      expect(response.body.results[1].text).toBeTruthy();
      expect(response.body.results[0].text).not.toEqual(response.body.results[1].text);
    });

    it('should handle invalid content ID', async () => {
      const response = await request(app)
        .post('/api/v1/ai/compare/999999')
        .send({
          prompt: 'Test prompt',
          models: ['openai']
        })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Content piece not found'
      });
    });

    it('should handle single model comparison', async () => {
      process.env.NODE_ENV = 'test';

      const response = await request(app)
        .post(`/api/v1/ai/compare/${contentPiece.id}`)
        .send({
          prompt: 'Generate content',
          models: ['openai']
        })
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].provider).toBe('openai');
    });

    it('should use default models when none specified', async () => {
      process.env.NODE_ENV = 'test';

      const response = await request(app)
        .post(`/api/v1/ai/compare/${contentPiece.id}`)
        .send({
          prompt: 'Generate content'
          // No models specified - should default to both
        })
        .expect(200);

      expect(response.body.results).toHaveLength(2);
      expect(response.body.results.map((r: any) => r.provider)).toEqual(
        expect.arrayContaining(['openai', 'anthropic'])
      );
    });
  });
});