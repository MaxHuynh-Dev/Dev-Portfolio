import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;

/**
 * The smoke spec, against a production server: `yarn build` first, then
 * `yarn test:e2e`. Not `next dev` — it renders every request from the
 * database and compiles routes on demand, which is the everyday way to
 * blow the route curtain's 3s cap (trap 32) and fail for the wrong reason.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, ...devices['Desktop Chrome'] },
  webServer: {
    command: `yarn start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
