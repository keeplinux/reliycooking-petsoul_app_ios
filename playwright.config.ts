import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/web',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, trace: 'retain-on-failure' },
  projects: [
    { name: 'android-chromium', use: { browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}, isMobile: true, hasTouch: true } },
    { name: 'ios-webkit', use: { browserName: 'webkit', isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
})
