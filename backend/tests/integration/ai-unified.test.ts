import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { validCampaignData, contentPieceData } from '../fixtures/campaigns';

const app = createApp();

describe('Unified AI System Integration Tests', () => {
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

  describe('POST /api/v1/ai/generate/:contentId - AI Content Generation', () => {
    it('should generate content using configured AI provider', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Generate compelling marketing content' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        contentPieceId: contentId,
        aiModel: expect.stringMatching(/^(openai|anthropic)$/),
        modelVersion: expect.stringMatching(/^(gpt-4|claude-3)$/),
        promptUsed: 'Generate compelling marketing content',
        generatedText: expect.any(String),
        metadata: expect.objectContaining({
          timestamp: expect.any(String),
          contentType: 'headline',
        }),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // In test environment, should use simulated AI
      expect(response.body.generatedText).toContain('AI-Generated:');
      expect(response.body.generatedText).toContain('Compelling & Engaging!');
    });

    it('should work without prompt parameter (use default)', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({})
        .expect(201);

      expect(response.body.generatedText).toBeDefined();
      expect(response.body.promptUsed).toBeNull();
      expect(response.body.aiModel).toMatch(/^(openai|anthropic)$/);
    });

    it('should update content status to ai_generated', async () => {
      // Generate content
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Test generation' })
        .expect(201);

      // Check content status was updated
      const contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(contentResponse.body.status).toBe('ai_generated');
    });

    it('should handle invalid content ID', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate/999999')
        .send({ prompt: 'Test' })
        .expect(404);

      expect(response.body.error).toContain('Content piece not found');
    });

    it('should handle non-numeric content ID', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate/invalid-id')
        .send({ prompt: 'Test' })
        .expect(400);

      expect(response.body.error).toContain('Invalid content ID');
    });

    it('should generate multiple unique pieces of content', async () => {
      const generations = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post(`/api/v1/ai/generate/${contentId}`)
          .send({ prompt: `Generation ${i + 1}` })
          .expect(201);
        
        generations.push(response.body);
      }

      // All should be unique
      const ids = generations.map(g => g.id);
      expect(new Set(ids).size).toBe(3);

      // All should use same AI provider
      const providers = generations.map(g => g.aiModel);
      expect(new Set(providers).size).toBe(1);

      // All should have different timestamps
      const timestamps = generations.map(g => g.createdAt);
      expect(new Set(timestamps).size).toBe(3);
    });
  });

  describe('POST /api/v1/ai/translate/:contentId - Content Translation', () => {
    it('should translate content to specified language', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'es' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        contentPieceId: contentId,
        targetLanguage: 'es',
        translatedText: expect.stringContaining('[ES Translation]:'),
        aiModel: expect.stringMatching(/^(openai|anthropic)$/),
        status: 'completed',
        qualityScore: expect.any(Number),
        createdAt: expect.any(String),
      });

      expect(response.body.qualityScore).toBeGreaterThanOrEqual(0);
      expect(response.body.qualityScore).toBeLessThanOrEqual(1);
    });

    it('should require targetLanguage parameter', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Target language is required');
    });

    it('should support multiple languages', async () => {
      const languages = ['es', 'fr', 'de', 'it', 'pt', 'zh'];
      const translations = [];

      for (const lang of languages) {
        const response = await request(app)
          .post(`/api/v1/ai/translate/${contentId}`)
          .send({ targetLanguage: lang })
          .expect(201);

        expect(response.body.targetLanguage).toBe(lang);
        expect(response.body.translatedText).toContain(`[${lang.toUpperCase()} Translation]:`);
        translations.push(response.body);
      }

      // All translations should be for same content
      translations.forEach(translation => {
        expect(translation.contentPieceId).toBe(contentId);
        expect(translation.status).toBe('completed');
      });
    });

    it('should handle invalid content ID for translation', async () => {
      const response = await request(app)
        .post('/api/v1/ai/translate/999999')
        .send({ targetLanguage: 'es' })
        .expect(404);

      expect(response.body.error).toContain('Content piece not found');
    });
  });

  describe('POST /api/v1/ai/analyze/:contentId - Content Analysis', () => {
    it('should analyze content and return structured data', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({})
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        analysis: expect.objectContaining({
          keywords: expect.arrayContaining([expect.any(String)]),
          tone: expect.any(String),
          sentiment: expect.objectContaining({
            label: expect.stringMatching(/^(positive|neutral|negative)$/),
            score: expect.any(Number),
          }),
          confidence: expect.any(Number),
        }),
        metadata: expect.objectContaining({
          timestamp: expect.any(String),
          contentType: 'analysis',
          targetId: null,
        }),
      });

      // Validate analysis structure
      expect(response.body.analysis.keywords.length).toBeGreaterThan(0);
      expect(response.body.analysis.sentiment.score).toBeGreaterThanOrEqual(0);
      expect(response.body.analysis.sentiment.score).toBeLessThanOrEqual(1);
      expect(response.body.analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should analyze specific AI generation when targetId provided', async () => {
      // First, generate some AI content
      const generationResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Generate exciting content' })
        .expect(201);

      const targetId = generationResponse.body.id;

      // Now analyze that specific generation
      const analysisResponse = await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({ targetId })
        .expect(201);

      expect(analysisResponse.body.metadata.targetId).toBe(targetId);
      expect(analysisResponse.body.analysis.keywords).toBeDefined();
    });

    it('should handle content with no analyzable text', async () => {
      // Create content with empty original content
      const emptyContentResponse = await request(app)
        .post('/api/v1/content')
        .send({
          campaignId,
          type: 'headline',
          originalContent: '',
          language: 'en',
        });

      const emptyContentId = emptyContentResponse.body.id;

      const response = await request(app)
        .post(`/api/v1/ai/analyze/${emptyContentId}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('No content to analyze');
    });

    it('should perform multiple analyses and return consistent structure', async () => {
      const analyses = [];

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post(`/api/v1/ai/analyze/${contentId}`)
          .send({})
          .expect(201);

        analyses.push(response.body);
      }

      // All should have same structure but different IDs
      analyses.forEach(analysis => {
        expect(analysis.analysis.keywords).toBeDefined();
        expect(analysis.analysis.tone).toBeDefined();
        expect(analysis.analysis.sentiment).toBeDefined();
        expect(analysis.analysis.confidence).toBeDefined();
      });

      const ids = analyses.map(a => a.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('GET /api/v1/ai/generations/:contentId - Generation History', () => {
    it('should return empty array when no generations exist', async () => {
      const response = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all generations for content piece', async () => {
      // Create multiple generations
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'First generation' });

      await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({});

      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Second generation' });

      const response = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      
      // Should be ordered by creation date (newest first)
      const timestamps = response.body.map((gen: any) => new Date(gen.createdAt).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    it('should include both content generations and analyses', async () => {
      // Generate content
      const genResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Content generation' });

      // Analyze content
      const analyzeResponse = await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({});

      const historyResponse = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(historyResponse.body).toHaveLength(2);
      
      // Find the generation and analysis
      const generation = historyResponse.body.find((item: any) => 
        !item.metadata?.contentType || item.metadata.contentType !== 'analysis'
      );
      const analysis = historyResponse.body.find((item: any) => 
        item.metadata?.contentType === 'analysis'
      );

      expect(generation).toBeDefined();
      expect(analysis).toBeDefined();
      expect(generation.generatedText).toContain('AI-Generated:');
      expect(analysis.metadata.contentType).toBe('analysis');
    });

    it('should handle invalid content ID', async () => {
      const response = await request(app)
        .get('/api/v1/ai/generations/invalid-id')
        .expect(400);

      expect(response.body.error).toContain('Invalid content ID');
    });
  });

  describe('End-to-End AI Workflow', () => {
    it('should complete full AI workflow: generate → analyze → translate', async () => {
      // Step 1: Generate AI content
      const generationResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Create engaging marketing content' })
        .expect(201);

      expect(generationResponse.body.generatedText).toBeDefined();

      // Step 2: Analyze the generated content
      const analysisResponse = await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({ targetId: generationResponse.body.id })
        .expect(201);

      expect(analysisResponse.body.analysis.keywords).toBeDefined();
      expect(analysisResponse.body.metadata.targetId).toBe(generationResponse.body.id);

      // Step 3: Translate the content
      const translationResponse = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'es' })
        .expect(201);

      expect(translationResponse.body.translatedText).toContain('[ES Translation]:');

      // Step 4: Verify all operations are tracked in generation history
      const historyResponse = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(historyResponse.body).toHaveLength(2); // Generation + Analysis (translation is separate)
      
      // Step 5: Check content status was updated
      const contentResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(200);

      expect(contentResponse.body.status).toBe('ai_generated');
    });

    it('should handle multiple content types with AI operations', async () => {
      const contentTypes = ['headline', 'description', 'body', 'cta', 'tagline'];
      const results = [];

      for (const type of contentTypes) {
        // Create content of different type
        const contentResponse = await request(app)
          .post('/api/v1/content')
          .send({
            campaignId,
            type,
            originalContent: `Test ${type} content`,
            language: 'en',
          });

        const typeContentId = contentResponse.body.id;

        // Generate AI content
        const generation = await request(app)
          .post(`/api/v1/ai/generate/${typeContentId}`)
          .send({ prompt: `Generate ${type}` })
          .expect(201);

        // Analyze content
        const analysis = await request(app)
          .post(`/api/v1/ai/analyze/${typeContentId}`)
          .send({})
          .expect(201);

        results.push({
          type,
          generation: generation.body,
          analysis: analysis.body,
        });
      }

      // All operations should succeed for all content types
      results.forEach(result => {
        expect(result.generation.metadata.contentType).toBe(result.type);
        expect(result.analysis.metadata.contentType).toBe('analysis');
        expect(result.generation.aiModel).toMatch(/^(openai|anthropic)$/);
      });
    });

    it('should maintain data consistency across multiple operations', async () => {
      const operations = [];

      // Perform multiple operations in sequence
      for (let i = 0; i < 5; i++) {
        const generation = await request(app)
          .post(`/api/v1/ai/generate/${contentId}`)
          .send({ prompt: `Generation ${i}` });

        const analysis = await request(app)
          .post(`/api/v1/ai/analyze/${contentId}`)
          .send({});

        operations.push({ generation: generation.body, analysis: analysis.body });
      }

      // All operations should be consistent
      operations.forEach((op, index) => {
        expect(op.generation.contentPieceId).toBe(contentId);
        expect(op.analysis.metadata.contentType).toBe('analysis');
        expect(op.generation.promptUsed).toBe(`Generation ${index}`);
      });

      // Check final generation history
      const history = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      expect(history.body).toHaveLength(10); // 5 generations + 5 analyses
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require more sophisticated setup to actually break the DB connection
      // For now, we test the error response format
      const response = await request(app)
        .post('/api/v1/ai/generate/99999')
        .send({ prompt: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should validate request parameters properly', async () => {
      // Test various invalid parameters
      const invalidRequests = [
        {
          endpoint: `/api/v1/ai/generate/${contentId}`,
          body: { prompt: '' }, // Empty prompt should still work
          expectedStatus: 201,
        },
        {
          endpoint: `/api/v1/ai/translate/${contentId}`,
          body: { targetLanguage: '' }, // Empty language
          expectedStatus: 400,
        },
        {
          endpoint: `/api/v1/ai/translate/${contentId}`,
          body: { targetLanguage: 'invalid-lang-code-that-is-very-long' },
          expectedStatus: 201, // Should still work, validation is minimal
        },
      ];

      for (const req of invalidRequests) {
        await request(app)
          .post(req.endpoint)
          .send(req.body)
          .expect(req.expectedStatus);
      }
    });

    it('should handle concurrent requests to same content', async () => {
      // Make multiple concurrent requests
      const concurrentPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post(`/api/v1/ai/generate/${contentId}`)
          .send({ prompt: `Concurrent ${i}` })
      );

      const responses = await Promise.all(concurrentPromises);

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.promptUsed).toBe(`Concurrent ${i}`);
        expect(response.body.contentPieceId).toBe(contentId);
      });

      // All should have unique IDs
      const ids = responses.map(r => r.body.id);
      expect(new Set(ids).size).toBe(5);
    });
  });
});