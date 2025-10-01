// Set test environment variables BEFORE any modules are imported
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'ai_content_test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = 'postgres';
// NODE_ENV=test automatically enables fake AI in controllers
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';