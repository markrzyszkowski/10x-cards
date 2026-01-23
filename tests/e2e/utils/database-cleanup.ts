import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Database cleanup utilities for E2E tests
 */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_EMAIL = process.env.E2E_USERNAME || "test@example.com";
const TEST_USER_ID = process.env.E2E_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Get test user ID by email
 */
async function getTestUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error fetching users:", error.message);
    return null;
  }

  const testUser = data.users.find((user) => user.email === TEST_EMAIL);
  return testUser?.id || null;
}

/**
 * Delete all flashcards for test user
 */
export async function deleteTestFlashcards(userId?: string): Promise<void> {
  const testUserId = userId || (await getTestUserId());

  if (!testUserId) {
    console.warn(`Test user not found: ${TEST_EMAIL}`);
    return;
  }

  const { error } = await supabase.from("flashcards").delete().eq("user_id", testUserId);

  if (error) {
    console.error("Error deleting flashcards:", error.message);
    throw error;
  }

  console.log(`✓ Deleted flashcards for test user: ${TEST_EMAIL}`);
}

/**
 * Delete all generations for test user
 */
export async function deleteTestGenerations(userId?: string): Promise<void> {
  const testUserId = userId || (await getTestUserId());

  if (!testUserId) {
    console.warn(`Test user not found: ${TEST_EMAIL}`);
    return;
  }

  const { error } = await supabase.from("generations").delete().eq("user_id", testUserId);

  if (error) {
    console.error("Error deleting generations:", error.message);
    throw error;
  }

  console.log(`✓ Deleted generations for test user: ${TEST_EMAIL}`);
}

/**
 * Clean up all test data for test user
 */
export async function cleanupTestData(): Promise<void> {
  console.log("\n🧹 Cleaning up test data...");

  try {
    const testUserId = await getTestUserId();

    if (!testUserId) {
      console.warn(`⚠️  Test user not found: ${TEST_EMAIL}`);
      console.warn("Skipping cleanup - no test data to clean");
      return;
    }

    console.log(`Found test user: ${TEST_EMAIL} (${testUserId})`);

    // Delete flashcards first (may have foreign key to generations)
    await deleteTestFlashcards(testUserId);

    // Delete generations
    await deleteTestGenerations(testUserId);

    console.log("✓ Test data cleanup completed successfully\n");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

/**
 * Get test data counts for verification
 */
export async function getTestDataCounts(): Promise<{
  flashcards: number;
  generations: number;
}> {
  const testUserId = await getTestUserId();

  if (!testUserId) {
    return { flashcards: 0, generations: 0 };
  }

  const { count: flashcardsCount } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", testUserId);

  const { count: generationsCount } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", testUserId);

  return {
    flashcards: flashcardsCount || 0,
    generations: generationsCount || 0,
  };
}

/**
 * Verify test user exists
 */
export async function verifyTestUser(): Promise<boolean> {
  const testUserId = await getTestUserId();
  return testUserId !== null;
}
