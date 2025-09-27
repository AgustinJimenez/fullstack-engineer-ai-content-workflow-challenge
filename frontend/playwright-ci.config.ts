import { defineConfig, devices } from '@playwright/test';

/**
 * CI/Headless configuration - no HTML report server
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Use console reporters instead of HTML server
  reporter: [
    ['list'],
    ['junit', { outputFile: '../test-results/junit-results.xml' }]
  ],
  
  use: {
    baseURL: process.env.FRONTEND_URL || 
      `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`,
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

  // Auto-start servers
  webServer: [
    {
      command: 'npm run dev',
      url: process.env.FRONTEND_URL || 
        `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../backend && npm run dev',
      url: process.env.NEXT_PUBLIC_API_URL || 
        `http://${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || 8080}`,
      reuseExistingServer: !process.env.CI,
    }
  ],

  timeout: 30000, // 30 second timeout per test
  expect: {
    timeout: 10000, // 10 second timeout for expect assertions
  },
});