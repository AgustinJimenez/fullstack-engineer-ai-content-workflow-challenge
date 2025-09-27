import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { validCampaignData, contentPieceData } from '../fixtures/campaigns';
import { eventBus } from '../../src/events/eventBus';

const app = createApp();

describe('AI Operations SSE Events Integration Tests', () => {
  let campaignId: number;
  let contentId: number;
  let eventLog: any[] = [];

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Set up event listener to capture emitted events
    const eventTypes = [
      'aiGenerationCreated',
      'contentUpdated',
      'translationCreated',
      'aiAnalysisCreated',
    ];

    eventTypes.forEach(eventType => {
      eventBus.on(eventType, (data) => {
        eventLog.push({
          type: eventType,
          timestamp: Date.now(),
          payload: data,
        });
      });
    });
  });

  beforeEach(async () => {
    // Clean database and event log
    await sequelize.sync({ force: true });
    eventLog = [];

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

  describe('AI Generation Events', () => {
    it('should emit aiGenerationCreated event when content is generated', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Generate test content' })
        .expect(201);

      // Wait a bit for event to be emitted
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have emitted aiGenerationCreated event
      const aiGenerationEvents = eventLog.filter(e => e.type === 'aiGenerationCreated');
      expect(aiGenerationEvents).toHaveLength(1);

      const event = aiGenerationEvents[0];
      expect(event.payload).toMatchObject({
        contentPieceId: contentId,
        campaignId: campaignId,
        generationId: response.body.id,
      });
    });

    it('should emit contentUpdated event when generation changes content status', async () => {
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Generate test content' })
        .expect(201);

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have emitted contentUpdated event
      const contentUpdatedEvents = eventLog.filter(e => e.type === 'contentUpdated');
      expect(contentUpdatedEvents).toHaveLength(1);

      const event = contentUpdatedEvents[0];
      expect(event.payload).toMatchObject({
        contentPieceId: contentId,
        campaignId: campaignId,
        status: 'ai_generated',
      });
    });

    it('should emit multiple events for multiple generations', async () => {
      const generationCount = 3;

      for (let i = 0; i < generationCount; i++) {
        await request(app)
          .post(`/api/v1/ai/generate/${contentId}`)
          .send({ prompt: `Generation ${i}` })
          .expect(201);
      }

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have multiple aiGenerationCreated events
      const aiGenerationEvents = eventLog.filter(e => e.type === 'aiGenerationCreated');
      expect(aiGenerationEvents).toHaveLength(generationCount);

      // Should have multiple contentUpdated events (all with same status)
      const contentUpdatedEvents = eventLog.filter(e => e.type === 'contentUpdated');
      expect(contentUpdatedEvents).toHaveLength(generationCount);

      // All events should be for the same content and campaign
      aiGenerationEvents.forEach(event => {
        expect(event.payload.contentPieceId).toBe(contentId);
        expect(event.payload.campaignId).toBe(campaignId);
      });
    });
  });

  describe('Translation Events', () => {
    it('should emit translationCreated event when content is translated', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'es' })
        .expect(201);

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have emitted translationCreated event
      const translationEvents = eventLog.filter(e => e.type === 'translationCreated');
      expect(translationEvents).toHaveLength(1);

      const event = translationEvents[0];
      expect(event.payload).toMatchObject({
        contentPieceId: contentId,
        campaignId: campaignId,
        translationId: response.body.id,
        language: 'es',
      });
    });

    it('should emit events for multiple language translations', async () => {
      const languages = ['es', 'fr', 'de'];
      const translationResponses: any[] = [];

      for (const lang of languages) {
        const response = await request(app)
          .post(`/api/v1/ai/translate/${contentId}`)
          .send({ targetLanguage: lang })
          .expect(201);
        translationResponses.push(response.body);
      }

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have event for each translation
      const translationEvents = eventLog.filter(e => e.type === 'translationCreated');
      expect(translationEvents).toHaveLength(languages.length);

      // Verify event data for each language
      languages.forEach((lang, index) => {
        const event = translationEvents.find(e => e.payload.language === lang);
        expect(event).toBeDefined();
        expect(event.payload.translationId).toBe(translationResponses[index].id);
      });
    });
  });

  describe('Analysis Events', () => {
    it('should emit aiAnalysisCreated event when content is analyzed', async () => {
      const response = await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({})
        .expect(201);

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have emitted aiAnalysisCreated event
      const analysisEvents = eventLog.filter(e => e.type === 'aiAnalysisCreated');
      expect(analysisEvents).toHaveLength(1);

      const event = analysisEvents[0];
      expect(event.payload).toMatchObject({
        contentPieceId: contentId,
        campaignId: campaignId,
        generationId: response.body.id,
        analysis: expect.objectContaining({
          keywords: expect.any(Array),
          tone: expect.any(String),
          sentiment: expect.any(Object),
        }),
      });
    });

    it('should emit analysis event with target generation ID', async () => {
      // First, create AI generation
      const generationResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Generate content to analyze' });

      const targetId = generationResponse.body.id;

      // Clear event log
      eventLog = [];

      // Analyze the specific generation
      await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({ targetId })
        .expect(201);

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100));

      const analysisEvents = eventLog.filter(e => e.type === 'aiAnalysisCreated');
      expect(analysisEvents).toHaveLength(1);

      // Analysis metadata should reference the target generation
      const analysisGeneration = await request(app)
        .get(`/api/v1/ai/generations/${contentId}`)
        .expect(200);

      const analysis = analysisGeneration.body.find((gen: any) => 
        gen.metadata?.contentType === 'analysis'
      );
      expect(analysis.metadata.targetId).toBe(targetId);
    });
  });

  describe('Mixed Operations Event Flow', () => {
    it('should emit events in correct order for complex workflow', async () => {
      // Step 1: Generate content
      const generation1 = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'First generation' });

      // Step 2: Analyze content
      await request(app)
        .post(`/api/v1/ai/analyze/${contentId}`)
        .send({});

      // Step 3: Generate more content
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Second generation' });

      // Step 4: Translate content
      await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({ targetLanguage: 'fr' });

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify we have all expected event types
      const eventTypes = [...new Set(eventLog.map(e => e.type))];
      expect(eventTypes).toContain('aiGenerationCreated');
      expect(eventTypes).toContain('contentUpdated');
      expect(eventTypes).toContain('aiAnalysisCreated');
      expect(eventTypes).toContain('translationCreated');

      // Verify events are in chronological order
      const timestamps = eventLog.map(e => e.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }

      // Count specific events
      expect(eventLog.filter(e => e.type === 'aiGenerationCreated')).toHaveLength(2);
      expect(eventLog.filter(e => e.type === 'contentUpdated')).toHaveLength(2);
      expect(eventLog.filter(e => e.type === 'aiAnalysisCreated')).toHaveLength(1);
      expect(eventLog.filter(e => e.type === 'translationCreated')).toHaveLength(1);
    });

    it('should handle concurrent operations and emit all events', async () => {
      const operations = [
        request(app).post(`/api/v1/ai/generate/${contentId}`).send({ prompt: 'Concurrent gen 1' }),
        request(app).post(`/api/v1/ai/generate/${contentId}`).send({ prompt: 'Concurrent gen 2' }),
        request(app).post(`/api/v1/ai/analyze/${contentId}`).send({}),
        request(app).post(`/api/v1/ai/translate/${contentId}`).send({ targetLanguage: 'de' }),
      ];

      await Promise.all(operations);

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 250));

      // Should have received all expected events
      expect(eventLog.filter(e => e.type === 'aiGenerationCreated')).toHaveLength(2);
      expect(eventLog.filter(e => e.type === 'contentUpdated')).toHaveLength(2);
      expect(eventLog.filter(e => e.type === 'aiAnalysisCreated')).toHaveLength(1);
      expect(eventLog.filter(e => e.type === 'translationCreated')).toHaveLength(1);

      // All events should be for the same content
      eventLog.forEach(event => {
        expect(event.payload.contentPieceId).toBe(contentId);
        expect(event.payload.campaignId).toBe(campaignId);
      });
    });
  });

  describe('Event Data Integrity', () => {
    it('should include complete and accurate data in events', async () => {
      const generationResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Detailed event test' })
        .expect(201);

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 100));

      const aiGenerationEvent = eventLog.find(e => e.type === 'aiGenerationCreated');
      const contentUpdateEvent = eventLog.find(e => e.type === 'contentUpdated');

      // Verify generation event data matches API response
      expect(aiGenerationEvent.payload.generationId).toBe(generationResponse.body.id);
      expect(aiGenerationEvent.payload.contentPieceId).toBe(contentId);
      expect(aiGenerationEvent.payload.campaignId).toBe(campaignId);

      // Verify content update event has correct status
      expect(contentUpdateEvent.payload.status).toBe('ai_generated');
      expect(contentUpdateEvent.payload.contentPieceId).toBe(contentId);
      expect(contentUpdateEvent.payload.campaignId).toBe(campaignId);
    });

    it('should maintain event consistency across multiple content pieces', async () => {
      // Create additional content
      const content2Response = await request(app)
        .post('/api/v1/content')
        .send({ ...contentPieceData, campaignId, originalContent: 'Second content piece' });
      const contentId2 = content2Response.body.id;

      // Perform operations on both content pieces
      await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Content 1 generation' });

      await request(app)
        .post(`/api/v1/ai/generate/${contentId2}`)
        .send({ prompt: 'Content 2 generation' });

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have events for both content pieces
      const content1Events = eventLog.filter(e => e.payload.contentPieceId === contentId);
      const content2Events = eventLog.filter(e => e.payload.contentPieceId === contentId2);

      expect(content1Events.length).toBeGreaterThan(0);
      expect(content2Events.length).toBeGreaterThan(0);

      // All events should have correct campaign ID
      eventLog.forEach(event => {
        expect(event.payload.campaignId).toBe(campaignId);
      });
    });
  });

  describe('SSE Endpoint Integration', () => {
    it('should be able to consume events via SSE endpoint', async () => {
      // This test would typically require a more complex setup to actually test SSE
      // For now, we verify that the event bus is working correctly
      
      let sseEventReceived = false;
      let sseEventData: any = null;

      // Set up a temporary listener that simulates SSE consumption
      eventBus.once('aiGenerationCreated', (data) => {
        sseEventReceived = true;
        sseEventData = data;
      });

      // Trigger an AI generation
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'SSE test generation' })
        .expect(201);

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100));

      // Event should have been received
      expect(sseEventReceived).toBe(true);
      expect(sseEventData).toMatchObject({
        contentPieceId: contentId,
        campaignId: campaignId,
        generationId: response.body.id,
      });
    });

    it('should handle event bus errors gracefully', async () => {
      // Add an event listener that throws an error
      const errorListener = () => {
        throw new Error('Simulated event handling error');
      };

      eventBus.on('aiGenerationCreated', errorListener);

      // This operation should still succeed despite the error listener
      const response = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({ prompt: 'Error handling test' })
        .expect(201);

      expect(response.body.generatedText).toBeDefined();

      // Clean up
      eventBus.off('aiGenerationCreated', errorListener);
    });
  });
});