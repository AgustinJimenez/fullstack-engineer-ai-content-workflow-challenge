import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { CampaignResolver } from './resolvers/CampaignResolver';
import { ContentResolver } from './resolvers/ContentResolver';
import { SubscriptionResolver } from './resolvers/SubscriptionResolver';

export async function createSchema() {
  return await buildSchema({
    resolvers: [CampaignResolver, ContentResolver, SubscriptionResolver],
    emitSchemaFile: true,
    validate: false, // Disable validation for now to avoid conflicts with Sequelize models
    pubSub: require('./pubsub').pubsub,
  });
}