import {defineConfig, devices} from "@playwright/test";
import {STORYBOOK_V7_PORT} from "./src/tests/utils/constants";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./src/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", {open: "never"}]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // we just need to test one browser, we are testing storybook functionality not its browser compatibility
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
    },
  ],

  /** @see https://playwright.dev/docs/api/class-testconfig#test-config-web-server */
  webServer: {
    command: "npm run storybook",
    url: `http://localhost:${STORYBOOK_V7_PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
