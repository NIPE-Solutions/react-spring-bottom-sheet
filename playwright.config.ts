import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/e2e/fixture/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 800 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 390, height: 800 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 800 },
      },
    },
    {
      name: 'chromium-touch',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run test:e2e:serve -- --port 4173',
    url: 'http://127.0.0.1:4173/e2e/fixture/',
    reuseExistingServer: !process.env.CI,
  },
})
