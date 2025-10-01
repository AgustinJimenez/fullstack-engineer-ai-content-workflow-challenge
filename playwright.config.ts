import { defineConfig, devices } from '@playwright/test';

const frontendHost = process.env.FRONTEND_HOST || 'localhost';
const frontendPort = process.env.FRONTEND_PORT || '3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for reliable test execution
  reporter: 'list', // Simpler reporter for faster output
  timeout: 45000, // Default timeout per test
  outputDir: 'test-results', // All test artifacts go here
  use: {
    baseURL: process.env.FRONTEND_URL || 
      `http://${process.env.FRONTEND_HOST || 'localhost'}:${process.env.FRONTEND_PORT || 3000}`,
    trace: 'on-first-retry', // Capture trace on retry
    screenshot: 'only-on-failure', // Screenshot on failure
    video: 'retain-on-failure', // Video only when test fails
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.NO_WEB_SERVER ? undefined : [
    {
      command: `bash -lc "
        # Check if server is running and ensure backend uses fake provider for tests
        if nc -z ${frontendHost} ${frontendPort}; then 
          echo 'Frontend already running at ${frontendHost}:${frontendPort}';
          echo 'Ensuring backend uses fake AI provider for tests...';
          if command -v docker-compose >/dev/null 2>&1; then 
            AI_PROVIDER=fake docker-compose -f compose.dev.yml up -d backend;
          else 
            AI_PROVIDER=fake docker compose -f compose.dev.yml up -d backend;
          fi;
        else 
          echo 'Starting services with fake AI provider for tests...';
          if command -v docker-compose >/dev/null 2>&1; then 
            AI_PROVIDER=fake docker-compose -f compose.dev.yml up --build; 
          else 
            AI_PROVIDER=fake docker compose -f compose.dev.yml up --build; 
          fi;
        fi"`,
      port: 3000,
      timeout: 120000,
      reuseExistingServer: true, // Always reuse existing server
      env: {
        AI_PROVIDER: 'fake'
      }
    },
  ],
});
