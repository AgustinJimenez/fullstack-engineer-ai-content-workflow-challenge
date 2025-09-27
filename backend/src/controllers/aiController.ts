import { Request, Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ContentPiece } from '../models/ContentPiece';
import { AIGeneration } from '../models/AIGeneration';
import { Translation } from '../models/Translation';
import { redisEventBus as eventBus } from '../events/redisEventBus';
import { langchainAI } from '../services/langchainService';

// Get unified AI configuration from environment variables
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // Default to OpenAI
const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

// Initialize AI clients based on provider
const openai = (AI_PROVIDER === 'openai' && AI_API_KEY) ? new OpenAI({
  apiKey: AI_API_KEY,
}) : null;

const anthropic = (AI_PROVIDER === 'anthropic' && AI_API_KEY) ? new Anthropic({
  apiKey: AI_API_KEY,
}) : null;

export class AIController {
  constructor() {
    this.generateContent = this.generateContent.bind(this);
    this.translateContent = this.translateContent.bind(this);
    this.analyzeContent = this.analyzeContent.bind(this);
    this.getGenerations = this.getGenerations.bind(this);
  }

  async generateContent(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { prompt, model } = req.body;

      const numericId = parseInt(contentId, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }

      // Verify content piece exists
      const contentPiece = await ContentPiece.findByPk(numericId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content piece not found' });
      }

      // Determine which provider to use (request parameter takes precedence)
      const selectedProvider = model || AI_PROVIDER;
      
      // Generate content using selected AI provider or fallback to simulation
      let generatedText: string;
      let modelVersion: string;

      const useSim = process.env.NODE_ENV === 'test' || process.env.USE_FAKE_AI === 'true' || !AI_API_KEY;

      if (useSim) {
        const base = contentPiece.originalContent || 'Sample content';
        generatedText = `AI-Generated (${selectedProvider}): ${base} — Compelling & Engaging!`;
        modelVersion = `${selectedProvider}-simulation`;
      } else {
        // Use LangChain as the unified AI provider
        const finalPrompt = prompt || 'Generate engaging content';
        
        generatedText = await langchainAI.generateContent(
          contentPiece.originalContent || '',
          contentPiece.type,
          finalPrompt,
          selectedProvider
        );
        modelVersion = `langchain-${selectedProvider}`;
      }

      const aiGeneration = await AIGeneration.create({
        contentPieceId: numericId,
        aiModel: selectedProvider,
        modelVersion: modelVersion,
        promptUsed: prompt,
        generatedText,
        metadata: {
          timestamp: new Date().toISOString(),
          contentType: contentPiece.type,
          selectedProvider: selectedProvider,
        },
      });

      // Update content piece status
      await contentPiece.update({ status: 'ai_generated' });

      // Emit SSE events
      await eventBus.emitEvent({
        type: 'aiGenerationCreated',
        payload: {
          contentPieceId: numericId,
          campaignId: contentPiece.campaignId,
          generationId: aiGeneration.id,
        },
      });
      await eventBus.emitEvent({
        type: 'contentUpdated',
        payload: {
          contentPieceId: numericId,
          campaignId: contentPiece.campaignId,
          status: 'ai_generated',
        },
      });

      res.status(201).json(aiGeneration);
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  }

  async translateContent(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { targetLanguage } = req.body;

      if (!targetLanguage) {
        return res.status(400).json({ error: 'Target language is required' });
      }

      // Verify content piece exists
      const numericId = parseInt(contentId, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      const contentPiece = await ContentPiece.findByPk(numericId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content piece not found' });
      }

      // Translate using configured AI provider or fallback to simulation
      let translatedText: string;

      const useSim = process.env.NODE_ENV === 'test' || process.env.USE_FAKE_AI === 'true' || !AI_API_KEY;

      if (useSim) {
        const base = contentPiece.originalContent || 'Sample content';
        translatedText = `[${targetLanguage.toUpperCase()} Translation]: ${base}`;
      } else if (AI_PROVIDER === 'openai') {
        const real = await this.translateWithOpenAI(
          contentPiece.originalContent || '',
          targetLanguage
        );
        translatedText = `[${targetLanguage.toUpperCase()} Translation]: ${real}`;
      } else if (AI_PROVIDER === 'anthropic') {
        const real = await this.translateWithAnthropic(
          contentPiece.originalContent || '',
          targetLanguage
        );
        translatedText = `[${targetLanguage.toUpperCase()} Translation]: ${real}`;
      } else if (AI_PROVIDER === 'langchain') {
        // Use LangChain as primary provider
        const real = await langchainAI.translateContent(
          contentPiece.originalContent || '',
          targetLanguage
        );
        translatedText = `[${targetLanguage.toUpperCase()} Translation]: ${real}`;
      } else {
        return res.status(400).json({ error: 'Unsupported AI provider' });
      }

      // Simulate a quality score (deterministic-ish in test)
      const qualityScore = process.env.NODE_ENV === 'test' ? 0.9 : Math.round((Math.random() * 0.2 + 0.8) * 100) / 100;

      const translation = await Translation.create({
        contentPieceId: numericId,
        targetLanguage,
        translatedText,
        aiModel: AI_PROVIDER,
        status: 'completed',
        qualityScore,
      });

      // Emit SSE event
      await eventBus.emitEvent({
        type: 'translationCreated',
        payload: {
          contentPieceId: numericId,
          campaignId: contentPiece.campaignId,
          translationId: translation.id,
          language: targetLanguage,
        },
      });

      res.status(201).json(translation);
    } catch (error) {
      console.error('Error translating content:', error);
      res.status(500).json({ error: 'Failed to translate content' });
    }
  }

  async analyzeContent(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { targetId } = req.body;

      const numericId = parseInt(contentId, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }

      // Verify content piece exists
      const contentPiece = await ContentPiece.findByPk(numericId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content piece not found' });
      }

      // Determine what content to analyze
      let textToAnalyze = contentPiece.originalContent || '';
      
      // If targetId is provided, analyze a specific AI generation
      if (targetId) {
        const targetGeneration = await AIGeneration.findOne({
          where: { id: targetId, contentPieceId: numericId }
        });
        if (targetGeneration) {
          textToAnalyze = targetGeneration.generatedText;
        }
      }

      if (!textToAnalyze.trim()) {
        return res.status(400).json({ error: 'No content to analyze' });
      }

      // Analyze content using configured AI provider or fallback to simulation
      let analysisResults: any;

      const useSim = process.env.NODE_ENV === 'test' || process.env.USE_FAKE_AI === 'true' || !AI_API_KEY;

      if (useSim) {
        // Simulate analysis results for testing/demo
        analysisResults = this.simulateAnalysis(textToAnalyze);
      } else if (AI_PROVIDER === 'openai') {
        analysisResults = await this.analyzeWithOpenAI(textToAnalyze);
      } else if (AI_PROVIDER === 'anthropic') {
        analysisResults = await this.analyzeWithAnthropic(textToAnalyze);
      } else if (AI_PROVIDER === 'langchain') {
        // Use LangChain as primary provider
        analysisResults = await langchainAI.analyzeContent(textToAnalyze);
      } else {
        return res.status(400).json({ error: 'Unsupported AI provider' });
      }

      // Store analysis results in AIGeneration metadata
      const aiGeneration = await AIGeneration.create({
        contentPieceId: numericId,
        aiModel: AI_PROVIDER,
        modelVersion: this.getModelVersion(AI_PROVIDER),
        promptUsed: 'Analyze content for keywords, tone, and sentiment',
        generatedText: `Analysis: ${analysisResults.keywords.join(', ')} | Tone: ${analysisResults.tone} | Sentiment: ${analysisResults.sentiment.label} (${analysisResults.sentiment.score})`,
        metadata: {
          ...analysisResults,
          timestamp: new Date().toISOString(),
          contentType: 'analysis',
          targetId: targetId || null,
        },
      });

      // Emit SSE event
      await eventBus.emitEvent({
        type: 'aiAnalysisCreated',
        payload: {
          contentPieceId: numericId,
          campaignId: contentPiece.campaignId,
          generationId: aiGeneration.id,
          analysis: analysisResults,
        },
      });

      res.status(201).json({
        id: aiGeneration.id,
        analysis: analysisResults,
        metadata: aiGeneration.metadata,
      });
    } catch (error) {
      console.error('Error analyzing content:', error);
      res.status(500).json({ error: 'Failed to analyze content' });
    }
  }

  async getGenerations(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const numericId = parseInt(contentId, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      const generations = await AIGeneration.findAll({
        where: { contentPieceId: numericId },
        order: [['createdAt', 'DESC']],
      });

      res.json(generations);
    } catch (error) {
      console.error('Error fetching generations:', error);
      res.status(500).json({ error: 'Failed to fetch generations' });
    }
  }

  private getModelVersion(aiModel: string): string {
    if (aiModel === 'openai') return 'gpt-4';
    if (aiModel === 'anthropic') return 'claude-3';
    if (aiModel === 'langchain') return 'langchain-unified';
    return 'unknown';
  }

  // Real OpenAI integration methods
  private async generateWithOpenAI(originalContent: string, contentType: string, prompt: string, targetLanguage?: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    try {
      const systemPrompt = this.getSystemPrompt(contentType);
      const userPrompt = originalContent 
        ? `Based on this content: "${originalContent}", ${prompt}`
        : prompt;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0].message.content || `Generated ${contentType} content`;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate content with OpenAI');
    }
  }

  private async translateWithOpenAI(text: string, targetLanguage: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. Only return the translated text, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 300,
        temperature: 0.3, // Lower temperature for more consistent translations
      });

      return completion.choices[0].message.content || `Translation to ${targetLanguage} failed`;
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw new Error('Failed to translate content with OpenAI');
    }
  }

  private getSystemPrompt(contentType: string): string {
    const prompts: Record<string, string> = {
      headline: 'You are a marketing copywriter. Create compelling, attention-grabbing headlines that drive engagement and conversions.',
      description: 'You are a marketing copywriter. Write persuasive product descriptions that highlight benefits and encourage action.',
      body: 'You are a content marketing specialist. Create engaging, informative content that provides value and builds trust with the audience.',
      cta: 'You are a conversion copywriter. Create compelling call-to-action text that motivates immediate action.',
      tagline: 'You are a brand strategist. Create memorable, concise taglines that capture the essence of a brand or product.',
      social_post: 'You are a social media manager. Create engaging social media content that drives interaction and shares.',
    };

    return prompts[contentType] || 'You are a professional copywriter. Create high-quality marketing content.';
  }

  // Anthropic integration methods
  private async generateWithAnthropic(originalContent: string, contentType: string, prompt: string, targetLanguage?: string): Promise<string> {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized - API key missing');
    }

    try {
      const systemPrompt = this.getSystemPrompt(contentType);
      const userPrompt = originalContent 
        ? `Based on this content: "${originalContent}", ${prompt}`
        : prompt;

      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      
      return `Generated ${contentType} content`;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to generate content with Anthropic');
    }
  }

  private async translateWithAnthropic(text: string, targetLanguage: string): Promise<string> {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized - API key missing');
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.3, // Lower temperature for more consistent translations
        system: `You are a professional translator. Translate the given text to ${targetLanguage}. Only return the translated text, nothing else.`,
        messages: [{
          role: 'user',
          content: text
        }]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      
      return `Translation to ${targetLanguage} failed`;
    } catch (error) {
      console.error('Anthropic translation error:', error);
      throw new Error('Failed to translate content with Anthropic');
    }
  }

  // Analysis helper methods for structured data extraction
  private simulateAnalysis(text: string): any {
    // Generate deterministic simulation results based on text content
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const keywords = words.slice(0, 5).map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
    
    // Simulate tone based on text characteristics
    const hasExclamation = text.includes('!');
    const hasQuestion = text.includes('?');
    const length = text.length;
    
    let tone = 'neutral';
    if (hasExclamation && length > 50) tone = 'enthusiastic';
    else if (hasQuestion) tone = 'inquisitive';
    else if (length < 30) tone = 'concise';
    else if (text.includes('professional') || text.includes('business')) tone = 'professional';
    
    // Simulate sentiment based on text patterns
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'good'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    let sentiment = { label: 'neutral', score: 0.5 };
    if (positiveCount > negativeCount) {
      sentiment = { label: 'positive', score: Math.min(0.7 + (positiveCount * 0.1), 0.95) };
    } else if (negativeCount > positiveCount) {
      sentiment = { label: 'negative', score: Math.max(0.3 - (negativeCount * 0.1), 0.05) };
    }
    
    return {
      keywords: keywords.slice(0, 3), // Return top 3 keywords
      tone,
      sentiment,
      confidence: 0.85,
      analysisType: 'simulated'
    };
  }

  private async analyzeWithOpenAI(text: string): Promise<any> {
    if (!openai) {
      throw new Error('OpenAI client not initialized - API key missing');
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a content analysis expert. Analyze the given text and extract structured data in the following JSON format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "professional|casual|enthusiastic|neutral|formal|friendly",
  "sentiment": {
    "label": "positive|neutral|negative",
    "score": 0.85
  },
  "confidence": 0.95
}
Return only the JSON response, no additional text.`
          },
          {
            role: 'user',
            content: `Analyze this content: "${text}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.2, // Lower temperature for consistent analysis
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        const analysisResult = JSON.parse(response);
        return {
          ...analysisResult,
          analysisType: 'openai'
        };
      } catch (parseError) {
        console.error('Failed to parse OpenAI analysis response:', parseError);
        // Fallback to simulation if parsing fails
        return this.simulateAnalysis(text);
      }
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error('Failed to analyze content with OpenAI');
    }
  }

  private async analyzeWithAnthropic(text: string): Promise<any> {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized - API key missing');
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.2, // Lower temperature for consistent analysis
        system: `You are a content analysis expert. Analyze the given text and extract structured data in the following JSON format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "professional|casual|enthusiastic|neutral|formal|friendly",
  "sentiment": {
    "label": "positive|neutral|negative",
    "score": 0.85
  },
  "confidence": 0.95
}
Return only the JSON response, no additional text.`,
        messages: [{
          role: 'user',
          content: `Analyze this content: "${text}"`
        }]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        try {
          const analysisResult = JSON.parse(content.text);
          return {
            ...analysisResult,
            analysisType: 'anthropic'
          };
        } catch (parseError) {
          console.error('Failed to parse Anthropic analysis response:', parseError);
          // Fallback to simulation if parsing fails
          return this.simulateAnalysis(text);
        }
      }
      
      throw new Error('Invalid response format from Anthropic');
    } catch (error) {
      console.error('Anthropic analysis error:', error);
      throw new Error('Failed to analyze content with Anthropic');
    }
  }
}
