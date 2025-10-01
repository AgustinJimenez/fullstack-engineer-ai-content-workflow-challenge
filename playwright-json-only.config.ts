import { defineConfig, devices } from '@playwright/test';

/**
 * JSON-only configuration - generates only JSON results file, no other output
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for reliable test execution
  
  // Only JSON reporter, no console output
  reporter: [
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  use: {
    baseURL: process.env.FRONTEND_URL || 
      `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`,
    trace: 'off', // No traces
    screenshot: 'off', // No screenshots  
    video: 'off', // No videos
  },

  // Only run on one browser to speed up
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start servers with test environment
  webServer: [
    {
      command: 'AI_PROVIDER=fake docker compose up --build',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: true,
      env: {
        AI_PROVIDER: 'fake'
      }
    },
  ],

  timeout: 45000, // Increased timeout for full suite
  expect: {
    timeout: 15000, // Increased expect timeout
  },
  
  // Add global setup/teardown if needed
  globalTimeout: 600000, // 10 minutes for entire suite
});
