import { Request, Response } from 'express';
import { AIController } from '../../src/controllers/aiController';
import { ContentPiece } from '../../src/models/ContentPiece';
import { AIGeneration } from '../../src/models/AIGeneration';
import { Translation } from '../../src/models/Translation';
import { eventBus } from '../../src/events/eventBus';

// Mock dependencies
jest.mock('../../src/models/ContentPiece');
jest.mock('../../src/models/AIGeneration');
jest.mock('../../src/models/Translation');
jest.mock('../../src/events/eventBus');

describe('AIController Unit Tests', () => {
  let aiController: AIController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock response
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    aiController = new AIController();

    // Mock environment variables for unified AI system
    process.env.USE_FAKE_AI = 'true';
    process.env.AI_PROVIDER = 'openai';
  });

  describe('generateContent', () => {
    beforeEach(() => {
      mockRequest = {
        params: { contentId: '123' },
        body: { prompt: 'Test prompt' },
      };
      
      // Reset environment variables
      process.env.AI_PROVIDER = 'openai';
      process.env.USE_FAKE_AI = 'true';
    });

    it('should generate content successfully with unified AI system', async () => {
      // Mock ContentPiece.findByPk
      const mockContentPiece = {
        id: 123,
        originalContent: 'Original content',
        type: 'headline',
        campaignId: 456,
        update: jest.fn(),
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      // Mock AIGeneration.create
      const mockGeneration = {
        id: 789,
        contentPieceId: 123,
        aiModel: 'openai',
        modelVersion: 'gpt-4',
        promptUsed: 'Test prompt',
        generatedText: 'AI-Generated: Original content — Compelling & Engaging!',
        metadata: {
          timestamp: expect.any(String),
          contentType: 'headline',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockGeneration);

      // Mock eventBus
      (eventBus.emitEvent as jest.Mock) = jest.fn();

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      // Verify database operations
      expect(ContentPiece.findByPk).toHaveBeenCalledWith(123);
      expect(AIGeneration.create).toHaveBeenCalledWith({
        contentPieceId: 123,
        aiModel: 'openai',
        modelVersion: 'gpt-4',
        promptUsed: 'Test prompt',
        generatedText: 'AI-Generated: Original content — Compelling & Engaging!',
        metadata: {
          timestamp: expect.any(String),
          contentType: 'headline',
        },
      });
      expect(mockContentPiece.update).toHaveBeenCalledWith({ status: 'ai_generated' });

      // Verify events were emitted
      expect(eventBus.emitEvent).toHaveBeenCalledTimes(2);
      expect(eventBus.emitEvent).toHaveBeenCalledWith({
        type: 'aiGenerationCreated',
        payload: {
          contentPieceId: 123,
          campaignId: 456,
          generationId: 789,
        },
      });
      expect(eventBus.emitEvent).toHaveBeenCalledWith({
        type: 'contentUpdated',
        payload: {
          contentPieceId: 123,
          campaignId: 456,
          status: 'ai_generated',
        },
      });

      // Verify response
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockGeneration);
    });

    it('should handle invalid content ID', async () => {
      mockRequest.params = { contentId: 'invalid' };

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Invalid content ID' });
    });

    it('should handle non-existent content piece', async () => {
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(null);

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Content piece not found' });
    });

    it('should work without prompt parameter', async () => {
      mockRequest.body = {};

      const mockContentPiece = {
        id: 123,
        originalContent: 'Original content',
        type: 'headline',
        campaignId: 456,
        update: jest.fn(),
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockGeneration = {
        id: 789,
        promptUsed: null,
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockGeneration);

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      expect(AIGeneration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          promptUsed: undefined, // No prompt provided
        })
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should handle different AI providers', async () => {
      // The AI provider is determined at module load time, so we need to test
      // that the controller uses the configured provider correctly
      const mockContentPiece = {
        id: 123,
        originalContent: 'Original content',
        type: 'headline',
        campaignId: 456,
        update: jest.fn(),
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockGeneration = {
        id: 789,
        aiModel: expect.stringMatching(/^(openai|anthropic)$/),
        modelVersion: expect.stringMatching(/^(gpt-4|claude-3)$/),
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockGeneration);

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      expect(AIGeneration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          aiModel: expect.stringMatching(/^(openai|anthropic)$/),
          modelVersion: expect.stringMatching(/^(gpt-4|claude-3)$/),
        })
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('translateContent', () => {
    beforeEach(() => {
      mockRequest = {
        params: { contentId: '123' },
        body: { targetLanguage: 'es' },
      };
    });

    it('should translate content successfully', async () => {
      const mockContentPiece = {
        id: 123,
        originalContent: 'Hello world',
        campaignId: 456,
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockTranslation = {
        id: 789,
        contentPieceId: 123,
        targetLanguage: 'es',
        translatedText: '[ES Translation]: Hello world',
        aiModel: 'openai',
        status: 'completed',
        qualityScore: 0.9,
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      (Translation.create as jest.Mock).mockResolvedValue(mockTranslation);

      await aiController.translateContent(mockRequest as Request, mockResponse as Response);

      expect(ContentPiece.findByPk).toHaveBeenCalledWith(123);
      expect(Translation.create).toHaveBeenCalledWith({
        contentPieceId: 123,
        targetLanguage: 'es',
        translatedText: '[ES Translation]: Hello world',
        aiModel: 'openai',
        status: 'completed',
        qualityScore: 0.9,
      });

      expect(eventBus.emitEvent).toHaveBeenCalledWith({
        type: 'translationCreated',
        payload: {
          contentPieceId: 123,
          campaignId: 456,
          translationId: 789,
          language: 'es',
        },
      });

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockTranslation);
    });

    it('should require targetLanguage parameter', async () => {
      mockRequest.body = {};

      await aiController.translateContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Target language is required' });
    });

    it('should handle different target languages', async () => {
      const languages = ['fr', 'de', 'it'];
      
      const mockContentPiece = {
        id: 123,
        originalContent: 'Hello world',
        campaignId: 456,
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      for (const lang of languages) {
        mockRequest.body = { targetLanguage: lang };

        const mockTranslation = {
          id: 789,
          targetLanguage: lang,
          translatedText: `[${lang.toUpperCase()} Translation]: Hello world`,
        };
        (Translation.create as jest.Mock).mockResolvedValue(mockTranslation);

        await aiController.translateContent(mockRequest as Request, mockResponse as Response);

        expect(Translation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            targetLanguage: lang,
            translatedText: `[${lang.toUpperCase()} Translation]: Hello world`,
          })
        );
      }
    });
  });

  describe('analyzeContent', () => {
    beforeEach(() => {
      mockRequest = {
        params: { contentId: '123' },
        body: {},
      };
    });

    it('should analyze content and return structured data', async () => {
      const mockContentPiece = {
        id: 123,
        originalContent: 'This is amazing content with great features!',
        campaignId: 456,
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockAnalysis = {
        id: 789,
        metadata: {
          keywords: ['amazing', 'content', 'great'],
          tone: 'enthusiastic',
          sentiment: { label: 'positive', score: 0.8 },
          confidence: 0.85,
          timestamp: expect.any(String),
          contentType: 'analysis',
          targetId: null,
        },
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockAnalysis);

      await aiController.analyzeContent(mockRequest as Request, mockResponse as Response);

      expect(ContentPiece.findByPk).toHaveBeenCalledWith(123);
      expect(AIGeneration.create).toHaveBeenCalledWith({
        contentPieceId: 123,
        aiModel: 'openai',
        modelVersion: 'gpt-4',
        promptUsed: 'Analyze content for keywords, tone, and sentiment',
        generatedText: expect.stringContaining('Analysis:'),
        metadata: expect.objectContaining({
          keywords: expect.any(Array),
          tone: expect.any(String),
          sentiment: expect.any(Object),
          confidence: expect.any(Number),
          contentType: 'analysis',
          targetId: null,
        }),
      });

      expect(eventBus.emitEvent).toHaveBeenCalledWith({
        type: 'aiAnalysisCreated',
        payload: {
          contentPieceId: 123,
          campaignId: 456,
          generationId: 789,
          analysis: expect.any(Object),
        },
      });

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        id: 789,
        analysis: expect.any(Object),
        metadata: expect.any(Object),
      });
    });

    it('should handle targetId for analyzing specific generation', async () => {
      mockRequest.body = { targetId: 456 };

      const mockContentPiece = {
        id: 123,
        originalContent: 'Original content',
        campaignId: 456,
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockTargetGeneration = {
        id: 456,
        generatedText: 'AI-generated text to analyze',
      };
      (AIGeneration.findOne as jest.Mock).mockResolvedValue(mockTargetGeneration);

      const mockAnalysis = {
        id: 789,
        metadata: { targetId: 456 },
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockAnalysis);

      await aiController.analyzeContent(mockRequest as Request, mockResponse as Response);

      expect(AIGeneration.findOne).toHaveBeenCalledWith({
        where: { id: 456, contentPieceId: 123 }
      });
      expect(AIGeneration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            targetId: 456,
          }),
        })
      );
    });

    it('should handle content with no text to analyze', async () => {
      const mockContentPiece = {
        id: 123,
        originalContent: '',
        campaignId: 456,
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      await aiController.analyzeContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'No content to analyze' });
    });
  });

  describe('getGenerations', () => {
    beforeEach(() => {
      mockRequest = {
        params: { contentId: '123' },
      };
    });

    it('should return all generations for content piece', async () => {
      const mockGenerations = [
        {
          id: 1,
          contentPieceId: 123,
          aiModel: 'openai',
          generatedText: 'First generation',
          createdAt: '2024-01-01T00:02:00.000Z',
        },
        {
          id: 2,
          contentPieceId: 123,
          aiModel: 'openai',
          generatedText: 'Second generation',
          createdAt: '2024-01-01T00:01:00.000Z',
        },
      ];
      (AIGeneration.findAll as jest.Mock).mockResolvedValue(mockGenerations);

      await aiController.getGenerations(mockRequest as Request, mockResponse as Response);

      expect(AIGeneration.findAll).toHaveBeenCalledWith({
        where: { contentPieceId: 123 },
        order: [['createdAt', 'DESC']],
      });
      expect(responseJson).toHaveBeenCalledWith(mockGenerations);
    });

    it('should return empty array when no generations exist', async () => {
      (AIGeneration.findAll as jest.Mock).mockResolvedValue([]);

      await aiController.getGenerations(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith([]);
    });

    it('should handle invalid content ID', async () => {
      mockRequest.params = { contentId: 'invalid' };

      await aiController.getGenerations(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Invalid content ID' });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in generateContent', async () => {
      mockRequest = {
        params: { contentId: '123' },
        body: { prompt: 'Test prompt' },
      };

      (ContentPiece.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to generate content' });
    });

    it('should handle database errors in translateContent', async () => {
      mockRequest = {
        params: { contentId: '123' },
        body: { targetLanguage: 'es' },
      };

      (ContentPiece.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await aiController.translateContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to translate content' });
    });

    it('should handle database errors in analyzeContent', async () => {
      mockRequest = {
        params: { contentId: '123' },
        body: {},
      };

      (ContentPiece.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await aiController.analyzeContent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to analyze content' });
    });

    it('should handle database errors in getGenerations', async () => {
      mockRequest = {
        params: { contentId: '123' },
      };

      (AIGeneration.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      await aiController.getGenerations(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to fetch generations' });
    });
  });

  describe('AI Provider Configuration', () => {
    it('should use configured AI provider', async () => {
      mockRequest = {
        params: { contentId: '123' },
        body: { prompt: 'Test prompt' },
      };

      const mockContentPiece = {
        id: 123,
        originalContent: 'Original content',
        type: 'headline',
        campaignId: 456,
        update: jest.fn(),
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockGeneration = {
        id: 789,
        aiModel: expect.stringMatching(/^(openai|anthropic)$/),
        modelVersion: expect.stringMatching(/^(gpt-4|claude-3)$/),
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockGeneration);

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      expect(AIGeneration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          aiModel: expect.stringMatching(/^(openai|anthropic)$/),
          modelVersion: expect.stringMatching(/^(gpt-4|claude-3)$/),
        })
      );
    });

    it('should use simulation mode when USE_FAKE_AI is true', async () => {
      process.env.USE_FAKE_AI = 'true';

      mockRequest = {
        params: { contentId: '123' },
        body: { prompt: 'Test prompt' },
      };

      const mockContentPiece = {
        id: 123,
        originalContent: 'Original content',
        type: 'headline',
        campaignId: 456,
        update: jest.fn(),
      };
      (ContentPiece.findByPk as jest.Mock).mockResolvedValue(mockContentPiece);

      const mockGeneration = {
        id: 789,
        generatedText: 'AI-Generated: Original content — Compelling & Engaging!',
      };
      (AIGeneration.create as jest.Mock).mockResolvedValue(mockGeneration);

      await aiController.generateContent(mockRequest as Request, mockResponse as Response);

      // Should use simulated AI generation
      expect(AIGeneration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          generatedText: 'AI-Generated: Original content — Compelling & Engaging!',
        })
      );
    });
  });
});