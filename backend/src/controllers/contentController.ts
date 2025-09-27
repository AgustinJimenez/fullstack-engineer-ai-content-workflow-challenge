import { Request, Response } from 'express';
import { ContentPiece } from '../models/ContentPiece';
import { Campaign } from '../models/Campaign';
import { Review } from '../models/Review';
import { AIGeneration } from '../models/AIGeneration';
import { Translation } from '../models/Translation';
import { redisEventBus as eventBus } from '../events/redisEventBus';

export class ContentController {
  async createContent(req: Request, res: Response) {
    try {
      const { campaignId, type, originalContent, language } = req.body;

      if (!campaignId || !type) {
        return res.status(400).json({ error: 'Campaign ID and type are required' });
      }

      // Verify campaign exists
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const contentPiece = await ContentPiece.create({
        campaignId,
        type,
        originalContent,
        language: language || 'en',
        status: 'draft',
      });

      res.status(201).json(contentPiece);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ error: 'Failed to create content' });
    }
  }

  async createContentForCampaign(req: Request, res: Response) {
    try {
      const { id: campaignId } = req.params;
      const { type, originalContent, language } = req.body;

      if (!type) {
        return res.status(400).json({ error: 'Type is required' });
      }

      // Verify campaign exists
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const contentPiece = await ContentPiece.create({
        campaignId: parseInt(campaignId),
        type,
        originalContent,
        language: language || 'en',
        status: 'draft',
      });

      await eventBus.emitEvent({
        type: 'contentUpdated',
        payload: { contentPieceId: contentPiece.id, campaignId: parseInt(campaignId) },
      });

      res.status(201).json(contentPiece);
    } catch (error) {
      console.error('Error creating content for campaign:', error);
      res.status(500).json({ error: 'Failed to create content' });
    }
  }

  async getContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      const contentPiece = await ContentPiece.findByPk(numericId, {
        include: [
          { model: Campaign, as: 'campaign' },
          { model: AIGeneration, as: 'aiGenerations' },
          { model: Review, as: 'reviews' },
          { model: Translation, as: 'translations' },
        ],
      });

      if (!contentPiece) {
        return res.status(404).json({ error: 'Content not found' });
      }

      console.log('Content piece found:', {
        id: contentPiece.id,
        aiGenerations: contentPiece.aiGenerations?.length || 0,
        aiGenerationsData: contentPiece.aiGenerations
      });

      res.json(contentPiece);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  async getCampaignContent(req: Request, res: Response) {
    console.log('🚨🚨🚨 GETCAMPAIGNCONTENT CALLED 🚨🚨🚨');
    try {
      const { id: campaignId } = req.params;
      const numericCampaignId = parseInt(campaignId, 10);
      if (Number.isNaN(numericCampaignId)) {
        return res.status(400).json({ error: 'Invalid campaign ID' });
      }
      const contentPieces = await ContentPiece.findAll({
        where: { campaignId: numericCampaignId },
        include: [
          { model: AIGeneration, as: 'aiGenerations' },
          { model: Translation, as: 'translations' },
        ],
        order: [['createdAt', 'DESC']],
      });

      console.log('=== CAMPAIGN CONTENT DEBUG ===', {
        campaignId: numericCampaignId,
        contentCount: contentPieces.length,
        firstContentPiece: contentPieces[0] ? {
          id: contentPieces[0].id,
          type: contentPieces[0].type,
          hasAiGenerations: !!contentPieces[0].aiGenerations,
          aiGenerationsCount: contentPieces[0].aiGenerations?.length || 0,
          fullData: JSON.stringify(contentPieces[0], null, 2)
        } : null
      });

      res.json(contentPieces);
    } catch (error) {
      console.error('Error fetching campaign content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  }

  async updateContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      const { originalContent, status } = req.body;

      const contentPiece = await ContentPiece.findByPk(numericId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content not found' });
      }

      await contentPiece.update({
        originalContent: originalContent !== undefined ? originalContent : contentPiece.originalContent,
        status: status || contentPiece.status,
      });

      // Emit status change event
      await eventBus.emitEvent({
        type: 'contentUpdated',
        payload: { contentPieceId: contentPiece.id, campaignId: contentPiece.campaignId, status },
      });

      res.json(contentPiece);
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ error: 'Failed to update content' });
    }
  }

  async deleteContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      const contentPiece = await ContentPiece.findByPk(numericId, {
        include: [
          { model: AIGeneration, as: 'aiGenerations' },
          { model: Review, as: 'reviews' },
          { model: Translation, as: 'translations' }
        ]
      });

      if (!contentPiece) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Manually delete related records to avoid foreign key constraint issues
      await AIGeneration.destroy({ where: { contentPieceId: numericId } });
      await Review.destroy({ where: { contentPieceId: numericId } });
      await Translation.destroy({ where: { contentPieceId: numericId } });
      
      const campaignId = contentPiece.campaignId;
      await contentPiece.destroy();
      
      // Emit campaign update using Redis event bus (should prevent infinite loops)
      await eventBus.emitEvent({
        type: 'campaignUpdated',
        payload: { campaignId },
      });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ error: 'Failed to delete content' });
    }
  }

  async createReview(req: Request, res: Response) {
    try {
      const { contentPieceId, reviewerName, status, feedback, language } = req.body;

      if (!contentPieceId || !status) {
        return res.status(400).json({ error: 'Content piece ID and status are required' });
      }

      // Validate status
      const validStatuses = ['approved', 'rejected', 'needs_revision'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be: approved, rejected, or needs_revision' 
        });
      }

      // Verify content piece exists
      const contentPiece = await ContentPiece.findByPk(contentPieceId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content piece not found' });
      }

      // Pick language: provided, else default to base content language
      const reviewLang = (language || contentPiece.language || 'en').toLowerCase();

      const review = await Review.create({
        contentPieceId,
        reviewerName: reviewerName || 'Anonymous Reviewer',
        status,
        feedback,
        language: reviewLang,
      });

      // Update content piece status based on review
      let newStatus = 'under_review';
      if (status === 'approved') newStatus = 'approved';
      else if (status === 'rejected') newStatus = 'rejected';
      else if (status === 'needs_revision') newStatus = 'under_review';

      await contentPiece.update({ status: newStatus });

      // Emit events
      await eventBus.emitEvent({
        type: 'reviewCreated',
        payload: { contentPieceId, campaignId: contentPiece.campaignId, reviewId: review.id, status },
      });
      await eventBus.emitEvent({
        type: 'contentUpdated',
        payload: { contentPieceId, campaignId: contentPiece.campaignId, status: newStatus },
      });

      // Load the review with content piece info for response
      const reviewWithContent = await Review.findByPk(review.id, {
        include: [{ model: ContentPiece, as: 'contentPiece' }]
      });

      res.status(201).json(reviewWithContent);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }

  // Compute language-specific approval roll-up for a content piece
  async getStatusRollup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }

      const piece = await ContentPiece.findByPk(numericId, {
        include: [Translation],
      });
      if (!piece) {
        return res.status(404).json({ error: 'Content not found' });
      }

      const languages = new Set<string>();
      if (piece.language) languages.add(piece.language.toLowerCase());
      (piece.translations || []).forEach(t => languages.add(String(t.targetLanguage).toLowerCase()));

      const allReviews = await Review.findAll({ where: { contentPieceId: numericId }, order: [['reviewedAt', 'DESC']] });

      const statusByLanguage: Record<string, string> = {};
      for (const lang of Array.from(languages)) {
        const latest = allReviews.find(r => (r.language ? r.language.toLowerCase() === lang : lang === piece.language.toLowerCase()));
        statusByLanguage[lang] = latest ? latest.status : 'pending';
      }

      const counts = { total: languages.size, approved: 0, rejected: 0, pending: 0, needs_revision: 0 };
      Object.values(statusByLanguage).forEach(s => {
        if (s === 'approved') counts.approved += 1;
        else if (s === 'rejected') counts.rejected += 1;
        else if (s === 'needs_revision') counts.needs_revision += 1;
        else counts.pending += 1;
      });

      let overallStatus = 'under_review';
      if (counts.approved === counts.total) overallStatus = 'approved';
      else if (counts.rejected > 0 && counts.approved === 0) overallStatus = 'rejected';

      res.json({ contentPieceId: numericId, statusByLanguage, counts, overallStatus });
    } catch (error) {
      console.error('Error computing status rollup:', error);
      res.status(500).json({ error: 'Failed to compute status rollup' });
    }
  }

  async submitForReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      
      const contentPiece = await ContentPiece.findByPk(numericId);
      if (!contentPiece) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Load AI generations to check if content is ready for review
      const contentWithGenerations = await ContentPiece.findByPk(numericId, {
        include: [{ model: AIGeneration, as: 'aiGenerations' }]
      });

      // Only allow submission if content has AI generations or original content
      if (!contentWithGenerations?.originalContent && 
          (!contentWithGenerations?.aiGenerations || contentWithGenerations.aiGenerations.length === 0)) {
        return res.status(400).json({ 
          error: 'Content must have original content or AI generations before review' 
        });
      }

      await contentPiece.update({ status: 'under_review' });

      // Emit status update
      await eventBus.emitEvent({
        type: 'contentUpdated',
        payload: { contentPieceId: contentPiece.id, campaignId: contentPiece.campaignId, status: 'under_review' },
      });

      res.json({ 
        message: 'Content submitted for review',
        contentPiece 
      });
    } catch (error) {
      console.error('Error submitting content for review:', error);
      res.status(500).json({ error: 'Failed to submit content for review' });
    }
  }

  async getReviews(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      
      const reviews = await Review.findAll({
        where: { contentPieceId: contentId },
        include: [{ model: ContentPiece, as: 'contentPiece' }],
        order: [['reviewedAt', 'DESC']],
      });

      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  async getContentForReview(req: Request, res: Response) {
    try {
      // Get all content pieces that are ready for review
      const where: any = { status: 'under_review' };
      const { language } = req.query as { language?: string };
      if (language) {
        where.language = String(language).toLowerCase();
      }

      const contentPieces = await ContentPiece.findAll({
        where,
        include: [
          { model: Campaign, as: 'campaign' },
          { model: AIGeneration, as: 'aiGenerations' },
          { model: Review, as: 'reviews' },
          { model: Translation, as: 'translations' },
        ],
        order: [['updatedAt', 'DESC']],
      });

      res.json(contentPieces);
    } catch (error) {
      console.error('Error fetching content for review:', error);
      res.status(500).json({ error: 'Failed to fetch content for review' });
    }
  }
}
