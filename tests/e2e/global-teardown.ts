import { FullConfig } from "@playwright/test";
import { cleanupTestData, getTestDataCounts } from "./utils/database-cleanup";

/**
 * Global teardown runs once after all tests complete
 * This cleans up test data from the database
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalTeardown(_config: FullConfig) {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("\n🧹 Running global teardown for E2E tests...\n");

  // Get counts before cleanup
  const beforeCounts = await getTestDataCounts();
  console.log("Test data created during tests:");
  console.log(`  - Flashcards: ${beforeCounts.flashcards}`);
  console.log(`  - Generations: ${beforeCounts.generations}`);

  if (beforeCounts.flashcards === 0 && beforeCounts.generations === 0) {
    console.log("\n✓ No test data to clean up\n");
    return;
  }

  // Clean up test data
  console.log("\nCleaning up test data...");
  await cleanupTestData();

  // Verify cleanup
  const afterCounts = await getTestDataCounts();
  if (afterCounts.flashcards > 0 || afterCounts.generations > 0) {
    console.error("\n❌ Warning: Some test data may not have been cleaned up");
    console.error(`Remaining - Flashcards: ${afterCounts.flashcards}, Generations: ${afterCounts.generations}`);
  } else {
    console.log("✓ All test data cleaned up successfully");
  }

  console.log("\n✓ Global teardown completed\n");
  console.log("=".repeat(60));
  console.log("\n");
}

export default globalTeardown;
