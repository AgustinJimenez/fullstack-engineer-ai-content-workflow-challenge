import { Sequelize } from 'sequelize-typescript';
import { Campaign } from '../models/Campaign';
import { ContentPiece } from '../models/ContentPiece';
import { AIGeneration } from '../models/AIGeneration';
import { Review } from '../models/Review';
import { Translation } from '../models/Translation';

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'ai_content_workflow',
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  models: [Campaign, ContentPiece, AIGeneration, Review, Translation],
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export { sequelize };