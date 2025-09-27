import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { CampaignResolver } from './resolvers/CampaignResolver';
import { ContentResolver } from './resolvers/ContentResolver';

export async function createSchema() {
  return await buildSchema({
    resolvers: [CampaignResolver, ContentResolver],
    emitSchemaFile: true,
    validate: false, // Disable validation for now to avoid conflicts with Sequelize models
  });
}