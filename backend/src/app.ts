import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import campaignRoutes from './routes/campaigns';
import contentRoutes from './routes/content';
import aiRoutes from './routes/ai';
import eventRoutes from './routes/events';
import healthRoutes from './routes/health';
import { createApolloServer } from './graphql/server';

export async function createApp() {
  const app = express();

  // Middleware
  // Configure helmet to allow GraphQL Playground in development
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
  }));
  
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
  }));
  
  // Only use morgan in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup GraphQL Server
  const apolloServer = await createApolloServer();
  await apolloServer.start();
  apolloServer.applyMiddleware({ 
    app: app as any, 
    path: '/graphql',
    cors: false // We handle CORS above
  });

  // Health and monitoring routes (no /api/v1 prefix for standard endpoints)
  app.use('/', healthRoutes);

  // API Routes
  app.use('/api/v1/campaigns', campaignRoutes);
  app.use('/api/v1/content', contentRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/events', eventRoutes);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
}
