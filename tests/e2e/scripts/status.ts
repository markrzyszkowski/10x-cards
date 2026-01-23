#!/usr/bin/env tsx

/**
 * Check test data status without cleaning
 *
 * Usage:
 *   npm run test:e2e:status
 *   or
 *   npx tsx tests/e2e/scripts/status.ts
 */

import { getTestDataCounts, verifyTestUser } from "../utils/database-cleanup";

async function main() {
  console.log("\n📊 Test Data Status\n");
  console.log("=".repeat(60));

  try {
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    console.log(`\nTest user: ${testEmail}`);

    // Verify user exists
    const userExists = await verifyTestUser();
    console.log(`User exists: ${userExists ? "✓ Yes" : "❌ No"}`);

    if (!userExists) {
      console.log("\n⚠️  Test user not found. Please create the test user before running tests.\n");
      console.log("=".repeat(60));
      console.log("\n");
      return;
    }

    // Get counts
    const counts = await getTestDataCounts();

    console.log("\nTest data counts:");
    console.log(`  - Flashcards: ${counts.flashcards}`);
    console.log(`  - Generations: ${counts.generations}`);

    if (counts.flashcards === 0 && counts.generations === 0) {
      console.log("\n✓ No test data found - database is clean\n");
    } else {
      console.log("\n💡 To clean up test data, run: npm run test:e2e:cleanup\n");
    }

    console.log("=".repeat(60));
    console.log("\n");
  } catch (error) {
    console.error("\n❌ Error checking status:", error);
    console.log("\n=".repeat(60));
    console.log("\n");
    process.exit(1);
  }
}

main();
