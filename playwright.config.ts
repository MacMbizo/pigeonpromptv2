import { defineConfig } from '@playwright/test';

// Ensure tests use the same base URL as the dev server started below
process.env.APP_URL = process.env.APP_URL || 'http://localhost:4100';

export default defineConfig({
  testDir: './tests/e2e',
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html'], ['./reporters/telemetry-dump-reporter.ts']] : 'list',
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:4100',
    trace: 'on-first-retry',
  },
  timeout: 30000,
  expect: { timeout: 5000 },
  webServer: {
    // Use a dedicated port to avoid collisions with a locally running dev instance
    command: 'npm run dev -- -p 4100',
    url: process.env.APP_URL || 'http://localhost:4100',
    reuseExistingServer: false, // always start fresh to apply test-specific env
    timeout: 120000,
    // Default to in-memory dev store for E2E unless a DB is explicitly provided via env
    env: {
      ...process.env,
      // Force non-local mode so code paths don't try to hit Postgres
      PIGEON_DB_MODE: 'supabase',
      PIGEON_USE_LOCAL_DB: 'false',
      NEXT_PUBLIC_E2E_ENABLE_CONTEXT_PREVIEW: '1',
      // Ensure no DB URLs leak from .env so LOCAL_DB_URL evaluates to undefined/empty
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      LOCAL_DATABASE_URL: '',
      DATABASE_URL: '',
    },
  },
});