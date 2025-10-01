import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Campaign } from '../../src/models/Campaign';
import { ContentPiece } from '../../src/models/ContentPiece';
import { AIGeneration } from '../../src/models/AIGeneration';
import { Review } from '../../src/models/Review';
import { Translation } from '../../src/models/Translation';

describe('Testcontainers Integration Tests', () => {
  let container: StartedPostgreSqlContainer;
  let sequelize: Sequelize;
  let app: any;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    // Configure Sequelize to use the container
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: container.getDatabase(),
      username: container.getUsername(),
      password: container.getPassword(),
      logging: false,
      models: [Campaign, ContentPiece, AIGeneration, Review, Translation],
    });

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Testcontainer database connected');

    // Sync models
    await sequelize.sync({ force: true });
    
    // Override the global sequelize instance for testing
    jest.doMock('../../src/config/database', () => ({ sequelize }));
    
    app = await createApp();
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    // Clean up all Redis connections
    try {
      const { closePubSub } = await import('../../src/graphql/pubsub');
      await closePubSub();
      
      const { redisEventBus } = await import('../../src/events/redisEventBus');
      await redisEventBus.disconnect();
    } catch (error) {
      console.log('Redis cleanup completed');
    }
    
    // Close database connection
    await sequelize.close();
    
    // Stop container
    await container.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await sequelize.sync({ force: true });
  });

  describe('Isolated Database Tests', () => {
    it('should run complete workflow with isolated database', async () => {
      // Step 1: Create Campaign
      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send({
          name: 'Testcontainer Campaign',
          description: 'Testing with isolated database',
        })
        .expect(201);

      const campaignId = campaignResponse.body.id;

      // Step 2: Add Content
      const contentResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/content`)
        .send({
          type: 'headline',
          originalContent: 'Isolated test content',
          language: 'en',
        })
        .expect(201);

      const contentId = contentResponse.body.id;

      // Step 3: Generate AI Content
      const aiResponse = await request(app)
        .post(`/api/v1/ai/generate/${contentId}`)
        .send({
          aiModel: 'openai',
          prompt: 'Generate test content',
        })
        .expect(201);

      expect(aiResponse.body.generatedText).toContain('AI-Generated:');

      // Step 4: Translate Content
      const translateResponse = await request(app)
        .post(`/api/v1/ai/translate/${contentId}`)
        .send({
          targetLanguage: 'es',
          aiModel: 'openai',
        })
        .expect(201);

      expect(translateResponse.body.translatedText).toContain('[ES Translation]:');

      // Step 5: Create Review
      const reviewResponse = await request(app)
        .post('/api/v1/content/reviews')
        .send({
          contentPieceId: parseInt(contentId),
          reviewerName: 'Test Reviewer',
          status: 'approved',
          feedback: 'Excellent work!',
        })
        .expect(201);

      expect(reviewResponse.body.status).toBe('approved');

      // Step 6: Verify Complete Workflow
      const finalCampaign = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(finalCampaign.body.contentPieces).toHaveLength(1);
      expect(finalCampaign.body.contentPieces[0].status).toBe('approved');
    });

    it('should handle concurrent operations with isolated database', async () => {
      // Create multiple campaigns concurrently
      const campaignPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/campaigns')
          .send({
            name: `Concurrent Campaign ${i + 1}`,
            description: `Testing concurrent operations ${i + 1}`,
          })
      );

      const campaignResponses = await Promise.all(campaignPromises);
      
      // All should succeed
      campaignResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all campaigns exist
      const allCampaigns = await request(app)
        .get('/api/v1/campaigns')
        .expect(200);

      expect(allCampaigns.body.data).toHaveLength(5);
    });

    it('should maintain database integrity during failures', async () => {
      // Create a campaign
      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send({
          name: 'Integrity Test Campaign',
          description: 'Testing database integrity',
        });

      const campaignId = campaignResponse.body.id;

      // Try to create content with invalid campaign ID (should fail)
      await request(app)
        .post('/api/v1/content')
        .send({
          campaignId: 99999, // Non-existent campaign
          type: 'headline',
          originalContent: 'This should fail',
        })
        .expect(404);

      // Original campaign should still exist
      const campaign = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(campaign.body.name).toBe('Integrity Test Campaign');
      expect(campaign.body.contentPieces).toHaveLength(0);
    });

    it('should handle database transactions correctly', async () => {
      // Create campaign
      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send({
          name: 'Transaction Test',
          description: 'Testing transactions',
        });

      const campaignId = campaignResponse.body.id;

      // Create content
      const contentResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/content`)
        .send({
          type: 'headline',
          originalContent: 'Transaction test content',
          language: 'en',
        });

      const contentId = contentResponse.body.id;

      // Delete campaign (should cascade delete content)
      await request(app)
        .delete(`/api/v1/campaigns/${campaignId}`)
        .expect(204);

      // Content should also be deleted (due to foreign key constraint)
      await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(404);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Create campaign
      const campaignResponse = await request(app)
        .post('/api/v1/campaigns')
        .send({
          name: 'Bulk Operations Test',
          description: 'Testing bulk performance',
        });

      const campaignId = campaignResponse.body.id;

      // Create multiple content pieces
      const contentPromises = Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post(`/api/v1/campaigns/${campaignId}/content`)
          .send({
            type: i % 2 === 0 ? 'headline' : 'description',
            originalContent: `Bulk content piece ${i + 1}`,
            language: 'en',
          })
      );

      await Promise.all(contentPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify all content was created
      const campaign = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(campaign.body.contentPieces).toHaveLength(20);
    });
  });

  describe('Database Schema Tests', () => {
    it('should enforce database constraints', async () => {
      // Try to create campaign with missing required field
      await request(app)
        .post('/api/v1/campaigns')
        .send({
          description: 'Missing name field',
        })
        .expect(400);

      // Try to create content with invalid foreign key
      await request(app)
        .post('/api/v1/content')
        .send({
          campaignId: 99999, // Non-existent campaign
          type: 'headline',
          originalContent: 'This should fail',
        })
        .expect(404);
    });

    it('should handle database relationships correctly', async () => {
      // Create campaign with content and related data
      const campaign = await request(app)
        .post('/api/v1/campaigns')
        .send({
          name: 'Relationship Test',
          description: 'Testing relationships',
        });

      const content = await request(app)
        .post(`/api/v1/campaigns/${campaign.body.id}/content`)
        .send({
          type: 'headline',
          originalContent: 'Test content',
          language: 'en',
        });

      const aiGeneration = await request(app)
        .post(`/api/v1/ai/generate/${content.body.id}`)
        .send({
          aiModel: 'openai',
          prompt: 'Test prompt',
        });

      // Verify relationships are properly loaded
      const fullCampaign = await request(app)
        .get(`/api/v1/campaigns/${campaign.body.id}`)
        .expect(200);

      expect(fullCampaign.body.contentPieces).toHaveLength(1);
      expect(fullCampaign.body.contentPieces[0].aiGenerations).toHaveLength(1);
    });
  });
});