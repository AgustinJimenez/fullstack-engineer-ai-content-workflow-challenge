import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration for running only working tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  
  // Only JSON reporter, no console output
  reporter: [
    ['json', { outputFile: 'test-results/working-results.json' }],
    ['line']
  ],
  
  use: {
    baseURL: process.env.FRONTEND_URL || 
      `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`,
    trace: 'off',
    screenshot: 'off', 
    video: 'off',
  },

  // Only run on one browser
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Test only the working files
  testMatch: [
    '**/01-campaign-creation.spec.ts',
    '**/02-content-creation.spec.ts',
    '**/03-ai-generation.spec.ts'
  ],

  // Auto-start servers
  webServer: [
    {
      command: 'docker compose up --build',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: true,
    },
  ],

  timeout: 45000,
  expect: {
    timeout: 15000,
  },
  
  globalTimeout: 600000, // 10 minutes for entire suite
});