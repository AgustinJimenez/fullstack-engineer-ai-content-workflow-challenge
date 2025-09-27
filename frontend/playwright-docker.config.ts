import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration for running tests against existing Docker containers
 * Assumes services are already running on localhost:3000 and localhost:8080
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for local testing
  workers: 1, // Use single worker for consistency
  
  // Use console reporters
  reporter: [
    ['list'],
    ['junit', { outputFile: '../test-results/junit-results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer config - assumes services are already running
  timeout: 30000, // 30 second timeout per test
  expect: {
    timeout: 10000, // 10 second timeout for expect assertions
  },
});