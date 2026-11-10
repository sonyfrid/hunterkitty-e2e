// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const STAND = process.env.STAND_URL || 'http://127.0.0.1:8099';
const PYTHON = process.env.HK_PYTHON || 'D:/jobradar/.venv/Scripts/python.exe';

module.exports = defineConfig({
  testDir: './tests',
  // у стенда одна база: тесты идут по очереди, перед каждым данные пересоздаются
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: STAND,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testDir: './tests/api' },
    { name: 'Pixel 7', testDir: './tests/e2e', use: { ...devices['Pixel 7'] } },
    { name: 'Galaxy S9+', testDir: './tests/e2e', use: { ...devices['Galaxy S9+'] } },
  ],
  webServer: {
    command: `"${PYTHON}" stand/stand.py`,
    url: `${STAND}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
