import { defineConfig, devices } from '@playwright/test';

// Plain config: does not start a webServer. Assumes the app is already running.
// Enables video capture for demos.

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
  // Define a default Chromium project for explicit targeting if needed
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});