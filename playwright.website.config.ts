import { defineConfig, devices } from '@playwright/test'

import { releaseReporters } from './scripts/playwright-release-config.mjs'

export default defineConfig({
  testDir: './e2e/website',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: releaseReporters(process.env.CI ? 'github' : 'list'),
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command:
      'npm run build:website && serve -l tcp://127.0.0.1:4174 -n -L website/out',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
  },
})
