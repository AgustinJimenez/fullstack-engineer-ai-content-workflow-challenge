import { defineConfig, devices } from '@playwright/test';

/**
 * XML-only configuration - generates only JUnit XML file, no other output
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Only JUnit XML reporter, no console output, no HTML
  reporter: [
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
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

  // Auto-start servers
  webServer: [
    {
      command: 'docker compose up --build',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});