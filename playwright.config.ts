import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : '80%', // Use 80% of CPU cores locally
  reporter: 'list', // Simpler reporter for faster output
  timeout: 45000, // Default timeout per test
  outputDir: 'test-results', // All test artifacts go here
  use: {
    baseURL: process.env.FRONTEND_URL || 
      `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`,
    trace: 'off', // Disable trace unless debugging
    screenshot: 'off', // Disable screenshots for speed
    video: 'off', // Disable video for speed
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'docker compose up --build',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});