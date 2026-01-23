import { FullConfig } from "@playwright/test";
import { cleanupTestData, verifyTestUser, getTestDataCounts } from "./utils/database-cleanup";

/**
 * Global setup runs once before all tests
 * This ensures we start with a clean database state
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(_config: FullConfig) {
  console.log("\n🚀 Running global setup for E2E tests...\n");

  // Verify test user exists
  console.log("Verifying test user exists...");
  const userExists = await verifyTestUser();

  if (!userExists) {
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    console.error(`\n❌ Test user not found: ${testEmail}`);
    console.error("Please create a test user before running E2E tests.");
    console.error("\nYou can create a test user via:");
    console.error("1. Supabase Dashboard > Authentication > Users");
    console.error("2. Your authentication API");
    console.error(`3. SQL: INSERT INTO auth.users (email, ...) VALUES ('${testEmail}', ...);\n`);
    throw new Error("Test user does not exist");
  }

  console.log("✓ Test user verified\n");

  // Get counts before cleanup
  const beforeCounts = await getTestDataCounts();
  console.log("Current test data:");
  console.log(`  - Flashcards: ${beforeCounts.flashcards}`);
  console.log(`  - Generations: ${beforeCounts.generations}`);

  // Clean up any existing test data
  if (beforeCounts.flashcards > 0 || beforeCounts.generations > 0) {
    console.log("\nCleaning up existing test data from previous runs...");
    await cleanupTestData();
  } else {
    console.log("\n✓ No existing test data found - starting fresh\n");
  }

  // Verify cleanup
  const afterCounts = await getTestDataCounts();
  if (afterCounts.flashcards > 0 || afterCounts.generations > 0) {
    console.error("❌ Failed to clean up test data");
    throw new Error("Cleanup verification failed");
  }

  console.log("✓ Global setup completed - ready to run tests\n");
  console.log("=".repeat(60));
  console.log("\n");
}

export default globalSetup;
