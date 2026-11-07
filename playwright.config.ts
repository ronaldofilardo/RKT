import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  webServer: {
    // Premissa P-01: o e2e roda SOMENTE contra racket_mvp_test. O pré-voo valida o
    // destino e o servidor sobe com DB_TARGET=test (NODE_ENV continua development).
    // Nunca reaproveita um servidor já aberto: ele poderia estar no banco de dev.
    command: 'tsx scripts/db/preflight.ts --mode=test -- node node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 180_000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
    },
  ],
});
