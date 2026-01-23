import { test as base } from "@playwright/test";
import { cleanupTestData } from "../utils/database-cleanup";

/**
 * Extended test fixture with automatic cleanup after each test
 * Use this if you want to clean up after EACH test instead of just at the end
 *
 * Usage:
 * import { test } from './fixtures/cleanup-fixture';
 *
 * test('my test', async ({ page, cleanup }) => {
 *   // Your test code
 *   // cleanup will run automatically after this test
 * });
 */

type CleanupFixture = {
  cleanup: void;
};

export const test = base.extend<CleanupFixture>({
  cleanup: [
    async ({}, use) => {
      // Setup: nothing to do before test
      await use();

      // Teardown: clean up after test
      await cleanupTestData();
    },
    { auto: true }, // This makes it run automatically for every test
  ],
});

export { expect } from "@playwright/test";
