import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TEST_EMAIL = process.env.E2E_USERNAME || "test@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "testpassword123";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_KEY");
}

async function verifyLogin() {
  console.log("\n🔐 Testing login credentials...\n");
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${"*".repeat(TEST_PASSWORD.length)}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.error("❌ Login failed!");
      console.error(`Error: ${error.message}`);
      console.error(`Status: ${error.status}`);
      console.error(`\nPossible solutions:`);
      console.error(`1. Verify the password in .env.test is correct`);
      console.error(`2. Check if the user's email is confirmed in Supabase`);
      console.error(`3. Reset the user's password in Supabase Dashboard`);
      process.exit(1);
    }

    console.log("✅ Login successful!");
    console.log(`User ID: ${data.user?.id}`);
    console.log(`Email: ${data.user?.email}`);
    console.log(`Email confirmed: ${data.user?.email_confirmed_at ? "Yes" : "No"}`);

    // Sign out
    await supabase.auth.signOut();
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

verifyLogin();
