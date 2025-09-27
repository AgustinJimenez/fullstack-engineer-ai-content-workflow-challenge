import dotenv from 'dotenv';
import { sequelize } from './config/database';
import { createApp } from './app';

dotenv.config();

const PORT = process.env.API_PORT || process.env.PORT || 8080;

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync database models
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');

    // Create app with GraphQL integration
    const app = await createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Liveness probe: http://localhost:${PORT}/health/live`);
      console.log(`✅ Readiness probe: http://localhost:${PORT}/health/ready`);
      console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
      console.log(`ℹ️  Info: http://localhost:${PORT}/info`);
      console.log(`🎯 REST API: http://localhost:${PORT}/api/v1`);
      console.log(`🎯 GraphQL API: http://localhost:${PORT}/graphql`);
      console.log(`🎮 GraphQL Playground: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();