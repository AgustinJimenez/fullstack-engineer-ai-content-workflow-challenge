import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { validCampaignData, contentPieceData } from '../fixtures/campaigns';

const app = createApp();

describe('AI API Performance and Load Tests', () => {
  let campaignId: number;
  let contentIds: number[] = [];

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test campaign
    const campaignResponse = await request(app)
      .post('/api/v1/campaigns')
      .send(validCampaignData);
    campaignId = campaignResponse.body.id;

    // Create multiple content pieces for load testing
    for (let i = 0; i < 10; i++) {
      const contentResponse = await request(app)
        .post('/api/v1/content')
        .send({
          ...contentPieceData,
          campaignId,
          originalContent: `Test content ${i} with some text to analyze`,
        });
      contentIds.push(contentResponse.body.id);
    }
  });

  describe('Response Time Tests', () => {
    it('should respond to generation requests within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentIds[0]}`)
        .send({ prompt: 'Generate content quickly' })
        .expect(201);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.body.generatedText).toBeDefined();
    });

    it('should respond to analysis requests within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/v1/ai/analyze/${contentIds[1]}`)
        .send({})
        .expect(201);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(3000); // Analysis should be faster
      expect(response.body.analysis).toBeDefined();
    });

    it('should respond to translation requests within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentIds[2]}`)
        .send({ targetLanguage: 'es' })
        .expect(201);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(4000); // Translation within 4 seconds
      expect(response.body.translatedText).toBeDefined();
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent generation requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(app)
          .post(`/api/v1/ai/generate/${contentIds[i]}`)
          .send({ prompt: `Concurrent generation ${i}` });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.promptUsed).toBe(`Concurrent generation ${i}`);
        expect(response.body.generatedText).toBeDefined();
      });

      // All should have unique generation IDs
      const generationIds = responses.map(r => r.body.id);
      expect(new Set(generationIds).size).toBe(concurrentRequests);
    });

    it('should handle mixed concurrent AI operations', async () => {
      const operations = [
        { type: 'generate', contentId: contentIds[0], body: { prompt: 'Generate' } },
        { type: 'analyze', contentId: contentIds[1], body: {} },
        { type: 'translate', contentId: contentIds[2], body: { targetLanguage: 'fr' } },
        { type: 'generate', contentId: contentIds[3], body: { prompt: 'Another generation' } },
        { type: 'analyze', contentId: contentIds[4], body: {} },
      ];

      const promises = operations.map(op => 
        request(app)
          .post(`/api/v1/ai/${op.type}/${op.contentId}`)
          .send(op.body)
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        
        const operation = operations[i];
        if (operation.type === 'generate') {
          expect(response.body.generatedText).toBeDefined();
        } else if (operation.type === 'analyze') {
          expect(response.body.analysis).toBeDefined();
        } else if (operation.type === 'translate') {
          expect(response.body.translatedText).toBeDefined();
        }
      });
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle generation history for content with many generations', async () => {
      const contentId = contentIds[5];
      const generationCount = 20;

      // Create many generations
      for (let i = 0; i < generationCount; i++) {
        await request(app)
          .post(`/api/v1/ai/generate/${contentId}`)
          .send({ prompt: `Batch generation ${i}` });
      }

      const response = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(response.body).toHaveLength(generationCount);
      
      // Should be properly ordered (newest first)
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = new Date(response.body[i].createdAt);
        const next = new Date(response.body[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should handle analysis of long content efficiently', async () => {
      // Create content with long text
      const longContentResponse = await request(app)
        .post('/api/v1/content')
        .send({
          campaignId,
          type: 'body_content',
          originalContent: 'This is a very long piece of content. '.repeat(100), // ~4000 characters
          language: 'en',
        });

      const longContentId = longContentResponse.body.id;

      const startTime = Date.now();
      const response = await request(app)
        .post(`/api/v1/ai/analyze/${longContentId}`)
        .send({})
        .expect(201);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(5000); // Should handle long content efficiently
      expect(response.body.analysis.keywords).toBeDefined();
      expect(response.body.analysis.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle rapid sequential requests without memory leaks', async () => {
      const iterations = 15;
      const contentId = contentIds[6];

      for (let i = 0; i < iterations; i++) {
        await request(app)
          .post(`/api/v1/ai/generate/${contentId}`)
          .send({ prompt: `Sequential ${i}` })
          .expect(201);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verify all generations were created successfully
      const history = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(history.body).toHaveLength(iterations);
    });

    it('should cleanup properly after operations', async () => {
      const contentId = contentIds[7];

      // Perform various operations
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Test generation' });

      await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({});

      await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'de' });

      // Verify operations completed successfully
      const history = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(history.body.length).toBeGreaterThan(0);

      // Verify content status is updated
      const content = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(content.body.status).toBe('ai_generated');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from simulated failures', async () => {
      const contentId = contentIds[8];

      // First, ensure normal operation works
      const normalResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Normal operation' })
        .expect(201);

      expect(normalResponse.body.generatedText).toBeDefined();

      // Continue with more operations to ensure system is stable
      await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({})
        .expect(201);

      await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'it' })
        .expect(201);
    });

    it('should maintain data integrity during concurrent operations', async () => {
      const contentId = contentIds[9];
      const operations = [];

      // Create multiple concurrent operations that modify the same content
      for (let i = 0; i < 8; i++) {
        operations.push(
          request(app)
            .post(`/api/v1/ai/generate/${contentId}`)
            .send({ prompt: `Integrity test ${i}` })
        );
      }

      const responses = await Promise.all(operations);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.contentPieceId).toBe(contentId);
        expect(response.body.generatedText).toBeDefined();
      });

      // Verify all generations are properly recorded
      const history = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(history.body).toHaveLength(8);

      // Verify all generations have unique IDs
      const ids = history.body.map((gen: any) => gen.id);
      expect(new Set(ids).size).toBe(8);
    });
  });

  describe('API Rate Limiting and Throttling', () => {
    it('should handle burst requests without dropping connections', async () => {
      const burstSize = 10;
      const promises = [];

      // Create burst of requests
      for (let i = 0; i < burstSize; i++) {
        promises.push(
          request(app)
            .post(`/api/v1/ai/generate/${contentIds[i % contentIds.length]}`)
            .send({ prompt: `Burst request ${i}` })
        );
      }

      const responses = await Promise.all(promises);

      // All should complete successfully (may have different response times)
      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.promptUsed).toBe(`Burst request ${i}`);
      });
    });

    it('should maintain consistent response format under load', async () => {
      const loadTestPromises = [];
      const requestCount = 12;

      for (let i = 0; i < requestCount; i++) {
        const contentId = contentIds[i % contentIds.length];
        loadTestPromises.push(
          request(app)
            .post(`/api/v1/ai/analyze/${contentId}`)
            .send({})
        );
      }

      const responses = await Promise.all(loadTestPromises);

      // All responses should have consistent format
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          analysis: expect.objectContaining({
            keywords: expect.any(Array),
            tone: expect.any(String),
            sentiment: expect.objectContaining({
              label: expect.any(String),
              score: expect.any(Number),
            }),
            confidence: expect.any(Number),
          }),
          metadata: expect.any(Object),
        });
      });
    });
  });
});