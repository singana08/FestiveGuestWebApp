import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * FestiveGuest (festiveguest.com) end-to-end test configuration.
 *
 * Run against the live site by default. Override BASE_URL to point at a
 * staging environment instead, e.g.:
 *   BASE_URL=https://staging.festiveguest.com npx playwright test
 */
const BASE_URL = process.env.BASE_URL || 'https://www.festiveguest.com';

/**
 * Some sandboxed environments ship a pre-installed Chromium at a fixed path
 * (potentially a different build than the installed @playwright/test
 * version expects) instead of letting `playwright install` download one.
 * Use it only when it's actually present; everywhere else (a normal dev
 * machine, CI after `playwright install chromium`) fall back to Playwright's
 * own managed browser by leaving executablePath undefined.
 */
const explicitChromiumPath = process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const chromiumExecutablePath = existsSync(explicitChromiumPath) ? explicitChromiumPath : undefined;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The homepage's 3D WebGL hero scene is heavy under headless Chromium —
  // even 3 concurrent contexts loading it caused GPU-stall-driven timeouts
  // (mainly on context teardown, unrelated to any actual assertion) in this
  // sandboxed environment. Serial execution trades speed for a trustworthy
  // signal; raise this if running somewhere with real GPU/more headroom.
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath ? { launchOptions: { executablePath: chromiumExecutablePath } } : {}),
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        ...(chromiumExecutablePath ? { launchOptions: { executablePath: chromiumExecutablePath } } : {}),
      },
    },
  ],
});
