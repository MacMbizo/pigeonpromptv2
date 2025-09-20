import { defineConfig, devices } from '@playwright/test';

// Local E2E config (no webServer):
// - Intended for running against an already-started dev server.
// - Start the app in another terminal: `npm run dev` (defaults to http://localhost:3100)
// - Then run: `npm run test:e2e:local` (this config)
// - APP_URL can override the base URL if needed, otherwise defaults to 3100.
// - Video enabled for easier debugging of local runs.

const APP_URL = process.env.APP_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  use: {
    baseURL: APP_URL,
    video: 'on',
    trace: 'off',
    screenshot: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  // Define cross-browser projects for local targeting
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});