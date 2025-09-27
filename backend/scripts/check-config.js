#!/usr/bin/env node

/**
 * Configuration Checker Script
 * 
 * This script validates environment configuration and checks
 * that all required dependencies are properly configured.
 * 
 * Usage:
 *   npm run check-config
 *   node scripts/check-config.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}`)
};

// Required environment variables
const requiredVars = [
  { name: 'DB_HOST', description: 'Database hostname' },
  { name: 'DB_NAME', description: 'Database name' },
  { name: 'DB_USER', description: 'Database username' },
  { name: 'DB_PASS', description: 'Database password' },
];

// Optional but recommended variables
const recommendedVars = [
  { name: 'OPENAI_API_KEY', description: 'OpenAI API key (or set USE_FAKE_AI=true)' },
  { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key (or set USE_FAKE_AI=true)' },
  { name: 'FRONTEND_URL', description: 'Frontend application URL' },
];

// Environment-specific checks
const environmentChecks = {
  development: [
    { name: 'LOG_LEVEL', recommended: 'debug' },
    { name: 'ENABLE_GRAPHQL_PLAYGROUND', recommended: 'true' },
  ],
  production: [
    { name: 'NODE_ENV', required: 'production' },
    { name: 'LOG_LEVEL', recommended: 'warn' },
    { name: 'ENABLE_GRAPHQL_PLAYGROUND', recommended: 'false' },
    { name: 'DB_SSL', recommended: 'true' },
  ]
};

function loadEnvironment() {
  // Load .env file if it exists
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    log.info('Loaded .env file');
  } else {
    log.warning('.env file not found - using system environment variables only');
  }
}

function checkRequiredVariables() {
  log.header('Checking Required Variables');
  
  let allRequired = true;
  
  for (const variable of requiredVars) {
    const value = process.env[variable.name];
    if (!value || value.trim() === '') {
      log.error(`${variable.name} is missing (${variable.description})`);
      allRequired = false;
    } else {
      log.success(`${variable.name} is set`);
    }
  }
  
  return allRequired;
}

function checkRecommendedVariables() {
  log.header('Checking Recommended Variables');
  
  for (const variable of recommendedVars) {
    const value = process.env[variable.name];
    if (!value || value.trim() === '') {
      if (variable.name.includes('API_KEY') && process.env.USE_FAKE_AI === 'true') {
        log.info(`${variable.name} is not set, but USE_FAKE_AI=true (OK for development/testing)`);
      } else {
        log.warning(`${variable.name} is not set (${variable.description})`);
      }
    } else {
      if (variable.name.includes('API_KEY')) {
        log.success(`${variable.name} is set (${value.substring(0, 10)}...)`);
      } else {
        log.success(`${variable.name} is set: ${value}`);
      }
    }
  }
}

function checkEnvironmentSpecific() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  log.header(`Checking ${nodeEnv.toUpperCase()} Environment Settings`);
  
  const checks = environmentChecks[nodeEnv] || [];
  
  for (const check of checks) {
    const value = process.env[check.name];
    
    if (check.required && value !== check.required) {
      log.error(`${check.name} should be "${check.required}" for ${nodeEnv}, got "${value}"`);
    } else if (check.recommended && value !== check.recommended) {
      log.warning(`${check.name} should be "${check.recommended}" for ${nodeEnv}, got "${value}"`);
    } else {
      log.success(`${check.name} is properly configured`);
    }
  }
}

async function checkDatabaseConnection() {
  log.header('Checking Database Connection');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: process.env.DB_SSL === 'true'
  };
  
  // Check if pg module is available
  try {
    const { Client } = require('pg');
    
    const client = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl
    });
    
    try {
      await client.connect();
      await client.query('SELECT 1');
      log.success('Database connection successful');
      await client.end();
    } catch (error) {
      log.error(`Database connection failed: ${error.message}`);
      log.info('Common issues:');
      log.info('  - Check if PostgreSQL is running');
      log.info('  - Verify database credentials');
      log.info('  - Ensure database exists');
      log.info('  - Check network connectivity');
    }
  } catch (error) {
    log.warning('Cannot test database connection - pg module not found');
    log.info('Run "npm install" to install dependencies');
  }
}

function checkAIConfiguration() {
  log.header('Checking AI Service Configuration');
  
  const useFakeAI = process.env.USE_FAKE_AI === 'true';
  
  if (useFakeAI) {
    log.info('Using fake AI responses (USE_FAKE_AI=true)');
    log.success('AI configuration is valid for testing');
    return;
  }
  
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (!openaiKey && !anthropicKey) {
    log.error('No AI API keys configured and USE_FAKE_AI is not enabled');
    log.info('Either:');
    log.info('  - Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY');
    log.info('  - Set USE_FAKE_AI=true for testing without API keys');
    return;
  }
  
  if (openaiKey) {
    if (openaiKey.startsWith('sk-')) {
      log.success('OpenAI API key format is valid');
    } else {
      log.error('OpenAI API key format is invalid (should start with "sk-")');
    }
  }
  
  if (anthropicKey) {
    if (anthropicKey.startsWith('sk-ant-')) {
      log.success('Anthropic API key format is valid');
    } else {
      log.error('Anthropic API key format is invalid (should start with "sk-ant-")');
    }
  }
}

function checkFilePermissions() {
  log.header('Checking File Permissions');
  
  const criticalFiles = [
    'package.json',
    'src/server.ts',
    'src/app.ts'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, '..', file);
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      log.success(`${file} is readable`);
    } catch (error) {
      log.error(`${file} is not readable: ${error.message}`);
    }
  }
}

function checkPorts() {
  log.header('Checking Port Configuration');
  
  const port = parseInt(process.env.PORT || '8080');
  
  if (isNaN(port) || port < 1 || port > 65535) {
    log.error(`Invalid port number: ${process.env.PORT}`);
  } else if (port < 1024) {
    log.warning(`Port ${port} requires root privileges on Unix systems`);
  } else {
    log.success(`Port ${port} is valid`);
  }
  
  // Check for common port conflicts
  const commonPorts = {
    3000: 'React development server',
    3001: 'Next.js development server',
    5432: 'PostgreSQL default port',
    6379: 'Redis default port'
  };
  
  if (commonPorts[port]) {
    log.warning(`Port ${port} is commonly used by ${commonPorts[port]}`);
  }
}

function printSummary(hasErrors) {
  log.header('Configuration Check Summary');
  
  if (hasErrors) {
    log.error('Configuration check completed with errors');
    log.info('Please fix the errors above before starting the application');
    log.info('See docs/environment-configuration.md for detailed configuration guide');
  } else {
    log.success('All configuration checks passed!');
    log.info('Your environment is ready for development');
  }
  
  log.info('\nUseful commands:');
  log.info('  npm run dev     - Start development server');
  log.info('  npm test        - Run test suite');
  log.info('  npm run build   - Build for production');
}

async function main() {
  console.log(`${colors.bold}🔧 AI Content Workflow Configuration Checker${colors.reset}\n`);
  
  let hasErrors = false;
  
  try {
    loadEnvironment();
    
    if (!checkRequiredVariables()) {
      hasErrors = true;
    }
    
    checkRecommendedVariables();
    checkEnvironmentSpecific();
    await checkDatabaseConnection();
    checkAIConfiguration();
    checkFilePermissions();
    checkPorts();
    
  } catch (error) {
    log.error(`Configuration check failed: ${error.message}`);
    hasErrors = true;
  }
  
  printSummary(hasErrors);
  
  process.exit(hasErrors ? 1 : 0);
}

// Run the configuration check
if (require.main === module) {
  main().catch((error) => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { main, checkRequiredVariables, checkDatabaseConnection };