// Set test environment first
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'ai_content_test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = 'postgres';

import { sequelize } from '../src/config/database';

// Global test setup
beforeAll(async () => {
  
  // Connect to test database
  try {
    await sequelize.authenticate();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
  }
});

beforeEach(async () => {
  // Clean up database before each test
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  }
});

afterAll(async () => {
  // Close database connection
  try {
    await sequelize.close();
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database disconnection failed:', error);
  }
});

// Global test utilities
declare global {
  var testTimeout: (ms: number) => Promise<void>;
}

(global as any).testTimeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));