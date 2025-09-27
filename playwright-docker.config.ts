import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration for running E2E tests against existing Docker containers
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run serially for consistency
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
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

  // No webServer config - assumes Docker services are already running
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
});