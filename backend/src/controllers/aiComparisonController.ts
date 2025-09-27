import { Request, Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ContentPiece } from '../models/ContentPiece';
import { AIGeneration } from '../models/AIGeneration';

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

interface ModelResult {
  provider: string;
  text: string;
  analysis?: {
    keywords: string[];
    tone: string;
    sentiment: {
      label: string;
      score: number;
    };
  };
  executionTime: number;
  cost?: number;
}

export class AIComparisonController {
  async compareModels(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { prompt, models = ['openai', 'anthropic'] } = req.body;

      const numericId = parseInt(contentId, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }

      // Verify content piece exists
      const contentPiece = await ContentPiece.findByPk(numericId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content piece not found' });
      }

      const finalPrompt = prompt || `Generate compelling ${contentPiece.type} content for marketing campaigns`;
      
      console.log(`Starting AI comparison for content ${numericId} with models:`, models);

      // Run comparisons in parallel
      const results: ModelResult[] = [];
      const promises = models.map(async (model: string) => {
        try {
          return await this.generateWithModel(model, finalPrompt, contentPiece);
        } catch (error) {
          console.error(`Error with ${model}:`, error);
          return {
            provider: model,
            text: `Error generating content with ${model}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            executionTime: 0,
            analysis: {
              keywords: [],
              tone: 'error',
              sentiment: { label: 'neutral', score: 0.5 }
            }
          };
        }
      });

      const modelResults = await Promise.all(promises);
      results.push(...modelResults);

      console.log(`Completed AI comparison with ${results.length} results`);

      // Save the best result as an AI generation (optional)
      if (results.length > 0) {
        const bestResult = results.reduce((prev, curr) => 
          prev.executionTime > 0 && prev.text.length > curr.text.length ? prev : curr
        );

        if (bestResult.text && !bestResult.text.startsWith('Error')) {
          await AIGeneration.create({
            contentPieceId: numericId,
            provider: 'comparison',
            text: bestResult.text,
            metadata: JSON.stringify({
              comparisonResults: results,
              bestProvider: bestResult.provider,
              ...bestResult.analysis
            }),
          });
        }
      }

      return res.json({
        success: true,
        results,
        summary: {
          totalModels: results.length,
          fastestModel: results.reduce((prev, curr) => 
            prev.executionTime > 0 && prev.executionTime < curr.executionTime ? prev : curr
          ).provider,
          longestContent: results.reduce((prev, curr) => 
            prev.text.length > curr.text.length ? prev : curr
          ).provider
        }
      });

    } catch (error) {
      console.error('AI comparison error:', error);
      return res.status(500).json({ 
        error: 'Failed to compare AI models',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async generateWithModel(
    model: string, 
    prompt: string, 
    contentPiece: ContentPiece
  ): Promise<ModelResult> {
    const startTime = Date.now();
    
    // Check if we should use fake AI
    const useFakeAI = process.env.NODE_ENV === 'test' || process.env.USE_FAKE_AI === 'true';
    
    if (useFakeAI || (model === 'openai' && !openai) || (model === 'anthropic' && !anthropic)) {
      return this.generateFakeResult(model, prompt, contentPiece, startTime);
    }

    try {
      let text = '';
      let cost = 0;

      if (model === 'openai' && openai) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional marketing copywriter. Generate compelling content for ${contentPiece.type} that is engaging, clear, and conversion-focused.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        text = completion.choices[0]?.message?.content || '';
        // Estimate cost (approximate)
        const inputTokens = prompt.length / 4;
        const outputTokens = text.length / 4;
        cost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000;

      } else if (model === 'anthropic' && anthropic) {
        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: `You are a professional marketing copywriter. Generate compelling content for ${contentPiece.type} that is engaging, clear, and conversion-focused.\n\n${prompt}`
            }
          ],
        });

        text = message.content[0]?.type === 'text' ? message.content[0].text : '';
        // Estimate cost for Claude
        const inputTokens = prompt.length / 4;
        const outputTokens = text.length / 4;
        cost = (inputTokens * 0.00025 + outputTokens * 0.00125) / 1000;
      }

      const executionTime = Date.now() - startTime;

      // Generate analysis
      const analysis = await this.analyzeContent(text);

      return {
        provider: model,
        text,
        analysis,
        executionTime,
        cost
      };

    } catch (error) {
      console.error(`Error generating with ${model}:`, error);
      return {
        provider: model,
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async generateFakeResult(
    model: string, 
    prompt: string, 
    contentPiece: ContentPiece, 
    startTime: number
  ): Promise<ModelResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    const fakeTexts = {
      openai: `🚀 Revolutionary ${contentPiece.type} crafted with precision! Experience innovation like never before with our cutting-edge solution that transforms your everyday challenges into opportunities. Join thousands who've already discovered the difference.`,
      anthropic: `Discover excellence in every ${contentPiece.type}. Our thoughtfully designed approach combines reliability with innovation, delivering results that exceed expectations. Built for those who value quality and performance in equal measure.`
    };

    const fakeAnalysis = {
      openai: {
        keywords: ['revolutionary', 'innovation', 'cutting-edge', 'transform', 'opportunities'],
        tone: 'enthusiastic',
        sentiment: { label: 'positive', score: 0.92 }
      },
      anthropic: {
        keywords: ['excellence', 'thoughtfully', 'reliability', 'innovation', 'quality'],
        tone: 'professional',
        sentiment: { label: 'positive', score: 0.85 }
      }
    };

    return {
      provider: model,
      text: fakeTexts[model as keyof typeof fakeTexts] || `Generated ${contentPiece.type} content from ${model}`,
      analysis: fakeAnalysis[model as keyof typeof fakeAnalysis] || {
        keywords: ['marketing', 'content', 'professional'],
        tone: 'professional',
        sentiment: { label: 'neutral', score: 0.7 }
      },
      executionTime: Date.now() - startTime,
      cost: Math.random() * 0.01 // Fake cost
    };
  }

  private async analyzeContent(text: string) {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    // Simple tone detection
    const enthusiasticWords = ['amazing', 'incredible', 'revolutionary', 'extraordinary', '!'];
    const professionalWords = ['solution', 'experience', 'quality', 'professional', 'excellence'];
    const casualWords = ['great', 'awesome', 'cool', 'nice', 'fun'];

    let tone = 'neutral';
    if (enthusiasticWords.some(word => text.toLowerCase().includes(word))) {
      tone = 'enthusiastic';
    } else if (professionalWords.some(word => text.toLowerCase().includes(word))) {
      tone = 'professional';
    } else if (casualWords.some(word => text.toLowerCase().includes(word))) {
      tone = 'casual';
    }

    // Simple sentiment analysis
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    let sentimentLabel = 'neutral';
    let sentimentScore = 0.5;
    
    if (positiveCount > negativeCount) {
      sentimentLabel = 'positive';
      sentimentScore = Math.min(0.5 + (positiveCount * 0.15), 1.0);
    } else if (negativeCount > positiveCount) {
      sentimentLabel = 'negative';
      sentimentScore = Math.max(0.5 - (negativeCount * 0.15), 0.0);
    }

    return {
      keywords,
      tone,
      sentiment: {
        label: sentimentLabel,
        score: sentimentScore
      }
    };
  }
}