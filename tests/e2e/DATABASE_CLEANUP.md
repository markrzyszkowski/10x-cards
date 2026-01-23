# Database Cleanup for E2E Tests

This document explains how database cleanup works for E2E tests and how to manage test data.

## Overview

E2E tests create real data in the database during execution. To prevent test pollution and ensure clean test runs, we implement automatic cleanup using Playwright's global setup and teardown hooks.

## How It Works

### 1. Global Setup (Before All Tests)

**File:** `tests/e2e/global-setup.ts`

Runs once before any tests execute:

1. ✅ **Verifies test user exists** - Fails if test user is not found
2. 🔍 **Checks for existing data** - Counts flashcards and generations
3. 🧹 **Cleans up leftover data** - Removes data from interrupted previous runs
4. ✅ **Verifies clean state** - Ensures database is ready

**Output:**
```
🚀 Running global setup for E2E tests...

Verifying test user exists...
✓ Test user verified

Current test data:
  - Flashcards: 0
  - Generations: 0

✓ No existing test data found - starting fresh

✓ Global setup completed - ready to run tests
```

### 2. Test Execution

Tests run normally and create data:
- Flashcards
- Generations
- Any other test data

### 3. Global Teardown (After All Tests)

**File:** `tests/e2e/global-teardown.ts`

Runs once after all tests complete:

1. 🔍 **Counts test data** - Shows what was created
2. 🧹 **Deletes all test data** - Removes flashcards and generations
3. ✅ **Verifies cleanup** - Confirms database is clean

**Output:**
```
🧹 Running global teardown for E2E tests...

Test data created during tests:
  - Flashcards: 8
  - Generations: 3

Cleaning up test data...
✓ Deleted flashcards for test user: test@example.com
✓ Deleted generations for test user: test@example.com
✓ Test data cleanup completed successfully

✓ All test data cleaned up successfully

✓ Global teardown completed
```

## Manual Cleanup

### Check Test Data Status

See what test data currently exists without deleting it:

```bash
npm run test:e2e:status
```

**Output:**
```
📊 Test Data Status

Test user: test@example.com
User exists: ✓ Yes

Test data counts:
  - Flashcards: 5
  - Generations: 2

💡 To clean up test data, run: npm run test:e2e:cleanup
```

### Manual Cleanup

If tests are interrupted or you need to reset manually:

```bash
npm run test:e2e:cleanup
```

**Output:**
```
🧹 Manual Test Data Cleanup

Current test data:
  - Flashcards: 5
  - Generations: 2

This will delete all test data for the test user.
Test user: test@example.com

🧹 Cleaning up test data...
✓ Deleted flashcards for test user: test@example.com
✓ Deleted generations for test user: test@example.com
✓ Test data cleanup completed successfully

Verifying cleanup...
  - Flashcards: 0
  - Generations: 0

✅ Cleanup completed successfully!
```

## Per-Test Cleanup (Advanced)

By default, cleanup runs only at the end of all tests. For complete test isolation, use the cleanup fixture:

### Usage

```typescript
// Instead of importing from @playwright/test
import { test, expect } from './fixtures/cleanup-fixture';

test('my isolated test', async ({ page }) => {
  // Test creates flashcards

  // Automatic cleanup happens after this test finishes
});

test('next test starts clean', async ({ page }) => {
  // Database is clean - previous test data is gone
});
```

### When to Use Per-Test Cleanup

✅ **Use when:**
- Tests need complete isolation
- Debugging specific test failures
- Tests have side effects that interfere with each other
- Testing edge cases that depend on clean state

❌ **Don't use when:**
- Tests are independent and don't interfere
- You want faster test execution
- Global cleanup is sufficient

**Performance Impact:** Per-test cleanup adds ~1-2 seconds per test. For a test suite with 10 tests, this could add 10-20 seconds to total execution time.

## Implementation Details

### Database Cleanup Utilities

**File:** `tests/e2e/utils/database-cleanup.ts`

Core functions:

```typescript
// Delete all flashcards for test user
await deleteTestFlashcards(userId);

// Delete all generations for test user
await deleteTestGenerations(userId);

// Delete all test data (flashcards + generations)
await cleanupTestData();

// Get counts of test data
const counts = await getTestDataCounts();
// Returns: { flashcards: number, generations: number }

// Check if test user exists
const exists = await verifyTestUser();
```

### Configuration

Cleanup uses environment variables from `.env.test`:

```env
# Test user credentials
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=testpassword123

# Database access
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important:** Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS policies for cleanup.

### Playwright Configuration

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  // Global setup runs before all tests
  globalSetup: "./tests/e2e/global-setup.ts",

  // Global teardown runs after all tests
  globalTeardown: "./tests/e2e/global-teardown.ts",

  // ... other config
});
```

## Troubleshooting

### Error: "Test user not found"

**Cause:** Test user doesn't exist in database.

**Solution:** Create test user before running tests:
```sql
-- Example for Supabase
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@example.com', crypt('testpassword123', gen_salt('bf')), NOW());
```

Or use Supabase Dashboard → Authentication → Users.

### Error: "Missing required environment variables"

**Cause:** `.env.test` not configured properly.

**Solution:** Ensure `.env.test` has:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_EMAIL`

### Warning: "Some test data may not have been cleaned up"

**Cause:** Database operation failed or was interrupted.

**Solution:** Run manual cleanup:
```bash
npm run test:e2e:cleanup
```

### Tests fail with "foreign key constraint" errors

**Cause:** Cleanup order matters. Flashcards may reference generations.

**Solution:** The cleanup utilities handle this automatically by deleting flashcards before generations. If you're writing custom cleanup, follow the same order.

## Safety Features

### 1. User Isolation
Cleanup only affects the test user specified in `E2E_TEST_EMAIL`. Other users' data is never touched.

### 2. Verification
Both setup and teardown verify cleanup was successful by counting remaining data.

### 3. Test Database
**Always use a separate test database!** Never run E2E tests against production.

### 4. Service Role Access
Cleanup uses service role key to bypass RLS, ensuring complete cleanup even if RLS policies would normally prevent deletion.

## Best Practices

1. **Use separate test database** - Never test against production
2. **Run status check** - Before running tests to verify clean state
3. **Monitor cleanup logs** - Review setup/teardown output for issues
4. **Manual cleanup when needed** - After interrupted tests
5. **Per-test cleanup sparingly** - Only when truly needed for isolation

## CI/CD Integration

Global setup and teardown work seamlessly in CI/CD:

```yaml
- name: Run E2E tests
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  run: npm run test:e2e
  # Cleanup happens automatically
```

No additional cleanup steps needed in CI - it's all automatic!

## Summary

| When | What Happens | Manual Command |
|------|--------------|----------------|
| Before tests | Verify user + clean old data | `npm run test:e2e:status` |
| During tests | Tests create data | N/A |
| After tests | Automatic cleanup | N/A |
| Manual cleanup | Remove test data anytime | `npm run test:e2e:cleanup` |
| Per-test cleanup | Clean after each test | Use `cleanup-fixture` |

The cleanup system ensures your E2E tests always start and end with a clean database, making tests reliable and repeatable! 🧹✨
