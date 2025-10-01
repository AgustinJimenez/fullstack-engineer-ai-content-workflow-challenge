import { Client } from 'pg';
import { Sequelize } from 'sequelize-typescript';

/**
 * Creates test database if it doesn't exist
 */
export async function ensureTestDatabase(): Promise<void> {
  const dbName = process.env.DB_NAME || 'ai_content_test';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: 'postgres', // Connect to default database to create test db
  });

  try {
    await client.connect();
    
    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      console.log(`📦 Creating test database: ${dbName}`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Test database created: ${dbName}`);
    } else {
      console.log(`✅ Test database already exists: ${dbName}`);
    }
  } catch (error) {
    // If error is that database already exists, that's fine
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`✅ Test database already exists: ${dbName}`);
    } else {
      console.error('❌ Failed to ensure test database:', error);
      throw error;
    }
  } finally {
    await client.end();
  }
}

/**
 * Drops all tables in the test database for clean test runs
 */
export async function cleanTestDatabase(sequelize: Sequelize): Promise<void> {
  try {
    // Drop all tables in the correct order to handle foreign key constraints
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO postgres;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
    
    // Sync all models to recreate tables
    await sequelize.sync({ force: true });
    console.log('✅ Test database cleaned and reinitialized');
  } catch (error) {
    console.error('❌ Failed to clean test database:', error);
    // Try alternative approach - sync with force
    try {
      await sequelize.sync({ force: true });
      console.log('✅ Test database cleaned using force sync');
    } catch (syncError) {
      console.error('❌ Failed to sync database:', syncError);
    }
  }
}