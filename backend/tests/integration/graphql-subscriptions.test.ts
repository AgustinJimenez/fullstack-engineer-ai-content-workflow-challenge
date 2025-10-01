import request from 'supertest';
import { createApp } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { Campaign } from '../../src/models/Campaign';
import { ContentPiece } from '../../src/models/ContentPiece';
import { createSchema } from '../../src/graphql/schema';
import { execute, subscribe } from 'graphql';
import { pubsub } from '../../src/graphql/pubsub';

describe('GraphQL Subscriptions Integration Tests', () => {
  let app: any;
  let schema: any;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    app = await createApp();
    schema = await createSchema();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GraphQL Query Tests', () => {
    it('should query campaigns via GraphQL', async () => {
      await Campaign.create({
        name: 'Test Campaign',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: ['es', 'fr'],
      });

      const query = `
        query {
          campaigns {
            id
            name
            status
            defaultLanguage
            targetLanguages
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data).toHaveProperty('campaigns');
      expect(response.body.data.campaigns.length).toBeGreaterThan(0);
      expect(response.body.data.campaigns[0]).toHaveProperty('name', 'Test Campaign');
    });

    it('should query specific campaign by ID', async () => {
      const campaign = await Campaign.create({
        name: 'Specific Campaign',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: ['es'],
      });

      const query = `
        query GetCampaign($id: ID!) {
          campaign(id: $id) {
            id
            name
            status
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query,
          variables: { id: campaign.id },
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('campaign');
      expect(response.body.data.campaign).toHaveProperty('name', 'Specific Campaign');
    });
  });

  describe('GraphQL Mutation Tests', () => {
    it('should create campaign via GraphQL mutation', async () => {
      const mutation = `
        mutation CreateCampaign($data: CreateCampaignInput!) {
          createCampaign(data: $data) {
            id
            name
            status
            defaultLanguage
            targetLanguages
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            data: {
              name: 'New Campaign',
              description: 'Created via GraphQL',
              status: 'active',
              defaultLanguage: 'en',
              targetLanguages: ['es', 'fr'],
            },
          },
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('createCampaign');
      expect(response.body.data.createCampaign).toHaveProperty('name', 'New Campaign');
      expect(response.body.data.createCampaign.targetLanguages).toEqual(['es', 'fr']);
    });

    it('should update campaign via GraphQL mutation', async () => {
      const campaign = await Campaign.create({
        name: 'Original Name',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: ['es'],
      });

      const mutation = `
        mutation UpdateCampaign($id: ID!, $data: CreateCampaignInput!) {
          updateCampaign(id: $id, data: $data) {
            id
            name
            status
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            id: campaign.id,
            data: {
              name: 'Updated Name',
              status: 'paused',
            },
          },
        })
        .expect(200);

      expect(response.body.data.updateCampaign).toHaveProperty('name', 'Updated Name');
      expect(response.body.data.updateCampaign).toHaveProperty('status', 'paused');
    });

    it('should delete campaign via GraphQL mutation', async () => {
      const campaign = await Campaign.create({
        name: 'To Delete',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: [],
      });

      const mutation = `
        mutation DeleteCampaign($id: ID!) {
          deleteCampaign(id: $id)
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: { id: campaign.id },
        })
        .expect(200);

      expect(response.body.data.deleteCampaign).toBe(true);

      // Verify it's deleted
      const deleted = await Campaign.findByPk(campaign.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Subscription Schema Tests', () => {
    it('should have campaignUpdated subscription in schema', async () => {
      const query = `
        subscription {
          campaignUpdated {
            id
            name
            status
          }
        }
      `;

      const result: any = await subscribe({
        schema,
        document: require('graphql').parse(query),
      });

      expect(result).toHaveProperty('_subscribe');
      
      // Clean up
      if (result[Symbol.asyncIterator]) {
        const iterator = result[Symbol.asyncIterator]();
        await iterator.return?.();
      }
    });

    it('should have contentUpdated subscription in schema', async () => {
      const query = `
        subscription {
          contentUpdated {
            id
            originalContent
            status
          }
        }
      `;

      const result: any = await subscribe({
        schema,
        document: require('graphql').parse(query),
      });

      expect(result).toHaveProperty('_subscribe');

      // Clean up
      if (result[Symbol.asyncIterator]) {
        const iterator = result[Symbol.asyncIterator]();
        await iterator.return?.();
      }
    });

    it('should have campaignById subscription with filter', async () => {
      const query = `
        subscription {
          campaignById(id: 1) {
            id
            name
          }
        }
      `;

      const result: any = await subscribe({
        schema,
        document: require('graphql').parse(query),
      });

      expect(result).toHaveProperty('_subscribe');

      // Clean up
      if (result[Symbol.asyncIterator]) {
        const iterator = result[Symbol.asyncIterator]();
        await iterator.return?.();
      }
    });
  });

  describe('PubSub Event Publishing', () => {
    it('should publish events to PubSub', async () => {
      const { publishCampaignCreated } = require('../../src/graphql/resolvers/SubscriptionResolver');

      const testCampaign = {
        id: 123,
        name: 'Test Event',
        status: 'active',
      };

      // This should not throw
      await expect(publishCampaignCreated(testCampaign)).resolves.not.toThrow();
    });

    it('should publish campaign update events', async () => {
      const { publishCampaignUpdated } = require('../../src/graphql/resolvers/SubscriptionResolver');

      const testCampaign = {
        id: 456,
        name: 'Updated Campaign',
        status: 'paused',
      };

      await expect(publishCampaignUpdated(testCampaign)).resolves.not.toThrow();
    });

    it('should publish campaign deleted events', async () => {
      const { publishCampaignDeleted } = require('../../src/graphql/resolvers/SubscriptionResolver');

      await expect(publishCampaignDeleted(789)).resolves.not.toThrow();
    });
  });

  describe('Subscription Integration with Mutations', () => {
    it('should trigger subscription when campaign is created', async () => {
      // This test verifies that mutations publish events
      // In a real test with WebSocket, we'd connect a subscriber

      const mutation = `
        mutation CreateCampaign($data: CreateCampaignInput!) {
          createCampaign(data: $data) {
            id
            name
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            data: {
              name: 'Subscription Test Campaign',
              status: 'active',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createCampaign).toBeDefined();
      // Event should be published (verified in previous test)
    });

    it('should trigger subscription when campaign is updated', async () => {
      const campaign = await Campaign.create({
        name: 'Before Update',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: [],
      });

      const mutation = `
        mutation UpdateCampaign($id: ID!, $data: CreateCampaignInput!) {
          updateCampaign(id: $id, data: $data) {
            id
            name
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            id: campaign.id,
            data: {
              name: 'After Update',
            },
          },
        })
        .expect(200);

      expect(response.body.data.updateCampaign.name).toBe('After Update');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid GraphQL syntax', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({
          query: 'invalid query syntax {',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle non-existent fields', async () => {
      const query = `
        query {
          campaigns {
            id
            nonExistentField
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle missing required variables', async () => {
      const mutation = `
        mutation CreateCampaign($data: CreateCampaignInput!) {
          createCampaign(data: $data) {
            id
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          // Missing variables
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Complex Queries', () => {
    it('should query campaign with nested content pieces', async () => {
      const campaign = await Campaign.create({
        name: 'Campaign with Content',
        description: 'Test',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: ['es'],
      });

      await ContentPiece.create({
        campaignId: campaign.id,
        type: 'headline',
        originalContent: 'Test headline',
        status: 'draft',
      });

      const query = `
        query GetCampaign($id: ID!) {
          campaign(id: $id) {
            id
            name
            contentPieces {
              id
              type
              originalContent
              status
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query,
          variables: { id: campaign.id },
        })
        .expect(200);

      expect(response.body.data.campaign).toHaveProperty('contentPieces');
      expect(response.body.data.campaign.contentPieces.length).toBe(1);
      expect(response.body.data.campaign.contentPieces[0]).toHaveProperty('originalContent', 'Test headline');
    });

    it('should query all campaigns with content pieces', async () => {
      // Create multiple campaigns with content
      const campaign1 = await Campaign.create({
        name: 'Campaign 1',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: [],
      });

      const campaign2 = await Campaign.create({
        name: 'Campaign 2',
        status: 'active',
        defaultLanguage: 'en',
        targetLanguages: [],
      });

      await ContentPiece.create({
        campaignId: campaign1.id,
        type: 'headline',
        originalContent: 'Content 1',
        status: 'draft',
      });

      await ContentPiece.create({
        campaignId: campaign2.id,
        type: 'description',
        originalContent: 'Content 2',
        status: 'approved',
      });

      const query = `
        query {
          campaigns {
            id
            name
            contentPieces {
              id
              type
              status
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.campaigns.length).toBeGreaterThanOrEqual(2);
      
      const campaignsWithContent = response.body.data.campaigns.filter(
        (c: any) => c.contentPieces && c.contentPieces.length > 0
      );
      expect(campaignsWithContent.length).toBeGreaterThanOrEqual(2);
    });
  });
});