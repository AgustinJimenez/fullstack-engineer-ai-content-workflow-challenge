import { Request, Response } from 'express';
import { Campaign } from '../models/Campaign';
import { ContentPiece } from '../models/ContentPiece';
import { redisEventBus as eventBus } from '../events/redisEventBus';

export class CampaignController {
  async createCampaign(req: Request, res: Response) {
    try {
      const { name, description, defaultLanguage, targetLanguages } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const langs = Array.isArray(targetLanguages)
        ? Array.from(new Set(targetLanguages.map((l: string) => String(l).toLowerCase()))).filter(Boolean)
        : [];

      const campaign = await Campaign.create({
        name,
        description,
        status: 'active',
        defaultLanguage: (defaultLanguage || 'en').toLowerCase(),
        targetLanguages: langs,
      });

      // Emit event
      await eventBus.emitEvent({ type: 'campaignCreated', payload: { campaignId: campaign.id } });

      res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  async getCampaigns(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        cursor,
        status,
        contentStatus,
        contentType,
        hasAIContent,
        hasTranslations,
        defaultLanguage,
        targetLanguages
      } = req.query;
      
      console.log('getCampaigns filters:', { status, contentStatus, contentType, hasAIContent, hasTranslations, defaultLanguage, targetLanguages });
      
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const { Op, Sequelize } = require('sequelize');
      
      const whereClause: any = {};
      
      if (cursor) {
        const cursorId = parseInt(cursor as string, 10);
        if (!isNaN(cursorId)) {
          whereClause.id = { [Op.lt]: cursorId };
        }
      }

      if (status) {
        // Handle both single value and array
        if (Array.isArray(status)) {
          whereClause.status = { [Op.in]: status };
        } else {
          whereClause.status = status;
        }
        console.log('Applied status filter:', status, 'whereClause:', whereClause);
      }

      // Handle defaultLanguage filter
      if (defaultLanguage) {
        const languages = Array.isArray(defaultLanguage) ? defaultLanguage : [defaultLanguage];
        whereClause.defaultLanguage = { [Op.in]: languages };
      }

      // Handle targetLanguages filter
      if (targetLanguages) {
        const targets = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
        const targetConditions = targets.map(lang => 
          Sequelize.where(
            Sequelize.cast(Sequelize.col('Campaign.target_languages'), 'text'),
            { [Op.like]: `%${lang}%` }
          )
        );
        if (targetConditions.length > 0) {
          if (!whereClause[Op.and]) whereClause[Op.and] = [];
          whereClause[Op.and].push({ [Op.or]: targetConditions });
        }
      }

      const contentInclude: any = {
        model: ContentPiece,
        as: 'contentPieces',
        required: false,
      };

      // For performance, use EXISTS subquery instead of required joins for content filtering
      console.log('🔍 Checking filters:', { contentStatus, contentType, hasAIContent, hasTranslations });
      if (contentStatus || contentType || hasAIContent === 'true' || hasTranslations === 'true') {
        console.log('🚀 Using optimized EXISTS query for content filtering');
        const { Op, Sequelize } = require('sequelize');
        
        const contentWhere = [];
        if (contentStatus) {
          // Handle both single value and array
          const statuses = Array.isArray(contentStatus) ? contentStatus : [contentStatus];
          const statusConditions = statuses.map(s => `cp.status = '${s}'`).join(' OR ');
          contentWhere.push(`(${statusConditions})`);
          console.log('✅ Added contentStatus filter:', contentStatus);
        }
        if (contentType) {
          // Handle both single value and array
          const types = Array.isArray(contentType) ? contentType : [contentType];
          const typeConditions = types.map(t => `cp.type = '${t}'`).join(' OR ');
          contentWhere.push(`(${typeConditions})`);
          console.log('✅ Added contentType filter:', contentType);
        }
        
        let additionalJoins = '';
        if (hasAIContent === 'true') {
          additionalJoins += ' INNER JOIN ai_generations ag ON ag.content_piece_id = cp.id';
          console.log('✅ Added AI content join');
        }
        if (hasTranslations === 'true') {
          additionalJoins += ' INNER JOIN translations t ON t.content_piece_id = cp.id';
          console.log('✅ Added translations join');
        }
        
        const existsQuery = `EXISTS (
          SELECT 1 FROM content_pieces cp 
          ${additionalJoins}
          WHERE cp.campaign_id = "Campaign".id 
          ${contentWhere.length > 0 ? 'AND ' + contentWhere.join(' AND ') : ''}
        )`;
        
        console.log('📝 Generated EXISTS query:', existsQuery);
        
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push(Sequelize.literal(existsQuery));
        
        // Still include content pieces for display, but without required constraint
        if (contentStatus) {
          contentInclude.where = { status: contentStatus };
        }
        if (contentType) {
          contentInclude.where = { ...contentInclude.where, type: contentType };
        }
      } else {
        // Original logic for non-content filters
        if (contentStatus) {
          contentInclude.where = { status: contentStatus };
          contentInclude.required = true;
        }

        if (contentType) {
          contentInclude.where = { ...contentInclude.where, type: contentType };
          contentInclude.required = true;
        }

        if (hasAIContent === 'true') {
          const { AIGeneration } = require('../models/AIGeneration');
          contentInclude.include = [{
            model: AIGeneration,
            as: 'aiGenerations',
            required: true,
          }];
          contentInclude.required = true;
        }

        if (hasTranslations === 'true') {
          const { Translation } = require('../models/Translation');
          contentInclude.include = [
            ...(contentInclude.include || []),
            {
              model: Translation,
              as: 'translations',
              required: true,
            }
          ];
          contentInclude.required = true;
        }
      }

      // Add timeout for content filtering queries
      const queryOptions = {
        where: whereClause,
        include: [contentInclude],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: cursor ? 0 : (pageNum - 1) * limitNum,
      };
      
      // Add logging for slow queries
      console.log('Executing campaign query with options:', JSON.stringify(queryOptions, null, 2));
      const startTime = Date.now();
      
      const campaigns = await Campaign.findAll(queryOptions as any);
      
      const queryTime = Date.now() - startTime;
      console.log(`Campaign query completed in ${queryTime}ms, found ${campaigns.length} campaigns`);

      const totalCount = cursor ? null : await Campaign.count({ where: whereClause });
      
      const hasMore = campaigns.length === limitNum;
      const nextCursor = hasMore && campaigns.length > 0 ? campaigns[campaigns.length - 1].id : null;
      
      res.json({
        data: campaigns,
        pagination: {
          page: cursor ? null : pageNum,
          limit: limitNum,
          total: totalCount,
          hasMore,
          nextCursor,
        },
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  async getCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid campaign ID' });
      }
      const campaign = await Campaign.findByPk(numericId, {
        include: [
          {
            model: ContentPiece,
            as: 'contentPieces',
          },
        ],
      });

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }

  async updateCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid campaign ID' });
      }
      const { name, description, status, defaultLanguage, targetLanguages } = req.body;

      const campaign = await Campaign.findByPk(numericId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const langs = Array.isArray(targetLanguages)
        ? Array.from(new Set(targetLanguages.map((l: string) => String(l).toLowerCase()))).filter(Boolean)
        : campaign.targetLanguages;

      await campaign.update({
        name: name || campaign.name,
        description: description !== undefined ? description : campaign.description,
        status: status || campaign.status,
        defaultLanguage: defaultLanguage || campaign.defaultLanguage,
        targetLanguages: langs,
      });

      // Emit update event
      await eventBus.emitEvent({ type: 'campaignUpdated', payload: { campaignId: campaign.id } });

      res.json(campaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }

  async deleteCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid campaign ID' });
      }
      const campaign = await Campaign.findByPk(numericId);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const campaignId = campaign.id;
      await campaign.destroy();
      // Emit delete event
      await eventBus.emitEvent({ type: 'campaignDeleted', payload: { campaignId } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }

  async getCampaignStats(req: Request, res: Response) {
    try {
      const { sequelize } = require('../config/database');
      const { 
        status,
        contentStatus,
        contentType,
        hasAIContent,
        hasTranslations,
        defaultLanguage,
        targetLanguages
      } = req.query;
      
      let campaignWhere = '';
      let contentWhere = '';
      const params: any[] = [];
      
      if (status) {
        // Handle both single value and array
        const statuses = Array.isArray(status) ? status : [status];
        const statusPlaceholders = statuses.map((_, idx) => `$${params.length + idx + 1}`).join(', ');
        campaignWhere += ` AND c.status IN (${statusPlaceholders})`;
        params.push(...statuses);
      }

      // Handle defaultLanguage filter
      if (defaultLanguage) {
        const languages = Array.isArray(defaultLanguage) ? defaultLanguage : [defaultLanguage];
        const placeholders = languages.map((_, idx) => `$${params.length + idx + 1}`).join(', ');
        campaignWhere += ` AND c.default_language IN (${placeholders})`;
        params.push(...languages);
      }

      // Handle targetLanguages filter
      if (targetLanguages) {
        const targets = Array.isArray(targetLanguages) ? targetLanguages : [targetLanguages];
        const targetConditions = targets.map((lang) => {
          const paramIdx = params.length + 1;
          params.push(`%${lang}%`);
          return `c.target_languages::text LIKE $${paramIdx}`;
        }).join(' OR ');
        campaignWhere += ` AND (${targetConditions})`;
      }

      if (contentStatus) {
        // Handle both single value and array
        const statuses = Array.isArray(contentStatus) ? contentStatus : [contentStatus];
        const statusPlaceholders = statuses.map((_, idx) => `$${params.length + idx + 1}`).join(', ');
        contentWhere += ` AND cp.status IN (${statusPlaceholders})`;
        params.push(...statuses);
      }

      if (contentType) {
        // Handle both single value and array
        const types = Array.isArray(contentType) ? contentType : [contentType];
        const typePlaceholders = types.map((_, idx) => `$${params.length + idx + 1}`).join(', ');
        contentWhere += ` AND cp.type IN (${typePlaceholders})`;
        params.push(...types);
      }

      if (hasAIContent === 'true') {
        contentWhere += ` AND EXISTS (SELECT 1 FROM ai_generations ag WHERE ag.content_piece_id = cp.id)`;
      }

      if (hasTranslations === 'true') {
        contentWhere += ` AND EXISTS (SELECT 1 FROM translations t WHERE t.content_piece_id = cp.id)`;
      }
      
      const query = `
        SELECT 
          COUNT(DISTINCT c.id) as "totalCampaigns",
          COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as "activeCampaigns",
          COUNT(DISTINCT cp.id) as "totalContentPieces",
          COUNT(DISTINCT CASE WHEN EXISTS (
            SELECT 1 FROM ai_generations ag WHERE ag.content_piece_id = cp.id
          ) THEN cp.id END) as "contentWithAI",
          COUNT(DISTINCT CASE WHEN cp.status = 'under_review' THEN cp.id END) as "contentUnderReview",
          COUNT(DISTINCT CASE WHEN cp.status = 'approved' THEN cp.id END) as "approvedContent",
          COUNT(t.id) as "totalTranslations"
        FROM campaigns c
        LEFT JOIN content_pieces cp ON cp.campaign_id = c.id ${contentWhere}
        LEFT JOIN translations t ON t.content_piece_id = cp.id
        WHERE 1=1 ${campaignWhere}
      `;

      const [results] = await sequelize.query(query, {
        bind: params,
        type: sequelize.QueryTypes.SELECT,
      });

      const stats = results as any;
      
      res.json({
        totalCampaigns: parseInt(stats.totalCampaigns) || 0,
        activeCampaigns: parseInt(stats.activeCampaigns) || 0,
        totalContentPieces: parseInt(stats.totalContentPieces) || 0,
        contentWithAI: parseInt(stats.contentWithAI) || 0,
        contentUnderReview: parseInt(stats.contentUnderReview) || 0,
        approvedContent: parseInt(stats.approvedContent) || 0,
        totalTranslations: parseInt(stats.totalTranslations) || 0,
      });
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      res.status(500).json({ error: 'Failed to fetch campaign stats' });
    }
  }

  // Test cleanup method - only use in test environment
  async deleteAllCampaigns(req: Request, res: Response) {
    try {
      // Only allow in test environment
      if (process.env.NODE_ENV !== 'test') {
        return res.status(403).json({ error: 'Not allowed in production' });
      }

      await Campaign.destroy({ where: {} });
      res.status(204).send();
    } catch (error) {
      console.error('Error cleaning database:', error);
      res.status(500).json({ error: 'Failed to clean database' });
    }
  }
}
