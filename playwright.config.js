import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/playwright' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['line']
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Security testing headers
    extraHTTPHeaders: {
      'X-Test-Mode': 'playwright'
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Security testing with different user agents
    {
      name: 'security-tests',
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'SecurityTestBot/1.0'
      },
      testMatch: '**/security/*.spec.js'
    },
    // Performance testing
    {
      name: 'performance-tests',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: '**/performance/*.spec.js'
    }
  ],

  webServer: {
    command: 'npm run serve',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Global test configuration
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // Test metadata for reporting
  metadata: {
    testType: 'e2e',
    browser: 'multi',
    environment: process.env.NODE_ENV || 'test'
  }
});