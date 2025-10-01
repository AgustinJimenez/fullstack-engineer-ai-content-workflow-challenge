import { sequelize } from '../src/config/database';
import { ensureTestDatabase, cleanTestDatabase } from './helpers/database-setup';

// Global test setup
beforeAll(async () => {
  // Ensure test database exists
  try {
    await ensureTestDatabase();
  } catch (error) {
    console.error('❌ Failed to ensure test database exists:', error);
    // Continue anyway - CI environment handles this differently
  }
  
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