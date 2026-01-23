#!/usr/bin/env tsx

/**
 * Standalone script to clean up test data
 *
 * Usage:
 *   npm run test:e2e:cleanup
 *   or
 *   npx tsx tests/e2e/scripts/cleanup.ts
 */

import { cleanupTestData, getTestDataCounts } from "../utils/database-cleanup";

async function main() {
  console.log("\n🧹 Manual Test Data Cleanup\n");
  console.log("=".repeat(60));

  try {
    // Show current counts
    const beforeCounts = await getTestDataCounts();
    console.log("\nCurrent test data:");
    console.log(`  - Flashcards: ${beforeCounts.flashcards}`);
    console.log(`  - Generations: ${beforeCounts.generations}`);

    if (beforeCounts.flashcards === 0 && beforeCounts.generations === 0) {
      console.log("\n✓ No test data to clean up\n");
      console.log("=".repeat(60));
      console.log("\n");
      return;
    }

    // Confirm cleanup
    console.log("\nThis will delete all test data for the test user.");
    console.log(`Test user: ${process.env.E2E_USERNAME || "test@example.com"}`);

    // Clean up
    await cleanupTestData();

    // Verify
    const afterCounts = await getTestDataCounts();
    console.log("\nVerifying cleanup...");
    console.log(`  - Flashcards: ${afterCounts.flashcards}`);
    console.log(`  - Generations: ${afterCounts.generations}`);

    if (afterCounts.flashcards === 0 && afterCounts.generations === 0) {
      console.log("\n✅ Cleanup completed successfully!\n");
    } else {
      console.log("\n⚠️  Some data may not have been cleaned up\n");
    }

    console.log("=".repeat(60));
    console.log("\n");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    console.log("\n=".repeat(60));
    console.log("\n");
    process.exit(1);
  }
}

main();
