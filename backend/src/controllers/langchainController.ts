import { Request, Response } from 'express';
import { langchainAI } from '../services/langchainService';

export class LangChainController {
  /**
   * POST /api/v1/langchain/smart-workflow
   * Execute the full smart content workflow: Generate → Analyze → Translate
   */
  async executeSmartWorkflow(req: Request, res: Response) {
    try {
      const { content, contentType, targetLanguages, provider } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        return res.status(400).json({ error: 'Target languages array is required' });
      }

      console.log(`🔗 Executing LangChain smart workflow for ${contentType || 'content'}`);

      const result = await langchainAI.smartContentWorkflow(
        content,
        contentType || 'marketing copy',
        targetLanguages,
        provider
      );

      res.json(result);
    } catch (error) {
      console.error('Error executing smart workflow:', error);
      res.status(500).json({ 
        error: 'Failed to execute smart workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/langchain/enhancement-chain
   * Execute content enhancement chain: Enhance → Refine → Summarize
   */
  async executeEnhancementChain(req: Request, res: Response) {
    try {
      const { content, contentType, provider } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      console.log(`🔗 Executing LangChain enhancement chain for ${contentType || 'content'}`);

      const result = await langchainAI.contentEnhancementChain(
        content,
        contentType || 'marketing copy',
        provider
      );

      res.json(result);
    } catch (error) {
      console.error('Error executing enhancement chain:', error);
      res.status(500).json({ 
        error: 'Failed to execute enhancement chain',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/langchain/multi-language
   * Execute parallel multi-language translation
   */
  async executeMultiLanguageChain(req: Request, res: Response) {
    try {
      const { content, targetLanguages, provider } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        return res.status(400).json({ error: 'Target languages array is required' });
      }

      console.log(`🔗 Executing LangChain multi-language chain for ${targetLanguages.length} languages`);

      const result = await langchainAI.multiLanguageChain(
        content,
        targetLanguages,
        provider
      );

      res.json(result);
    } catch (error) {
      console.error('Error executing multi-language chain:', error);
      res.status(500).json({ 
        error: 'Failed to execute multi-language chain',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/langchain/content/:contentId/workflow
   * Execute smart workflow for an existing content piece
   */
  async executeWorkflowForContent(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { provider, targetLanguages } = req.body;
      const { ContentPiece } = require('../models/ContentPiece');
      const { Campaign } = require('../models/Campaign');

      const content = await ContentPiece.findByPk(parseInt(contentId), {
        include: [{ model: Campaign, as: 'campaign' }]
      });

      if (!content) {
        return res.status(404).json({ error: 'Content piece not found' });
      }

      const campaign = content.campaign;
      const languagesToUse = targetLanguages || campaign?.targetLanguages || ['es', 'fr'];

      console.log(`🔗 Executing workflow for content #${contentId}`);

      const result = await langchainAI.smartContentWorkflow(
        content.originalContent || '',
        content.type || 'marketing copy',
        languagesToUse,
        provider
      );

      // Optionally save the results back to the content piece
      await content.update({
        originalContent: result.generated,
        metadata: {
          ...content.metadata,
          langchainWorkflow: {
            executedAt: new Date().toISOString(),
            analysis: result.analysis,
            translations: result.translations,
          },
        },
      });

      res.json({
        contentId: content.id,
        ...result,
      });
    } catch (error) {
      console.error('Error executing workflow for content:', error);
      res.status(500).json({ 
        error: 'Failed to execute workflow for content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const langchainController = new LangChainController();