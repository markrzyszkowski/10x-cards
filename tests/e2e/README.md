# E2E Tests with Playwright

End-to-end tests for the 10x Cards application using Playwright and the Page Object Model pattern.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Playwright** installed via npm
3. **Test database** configured with test user credentials
4. **Environment variables** set in `.env.test`

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install Playwright and its dependencies.

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Configure Test Environment

Create a `.env.test` file in the project root with the following variables:

```env
# Base URL for the application
BASE_URL=http://localhost:3000

# Test user credentials
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=testpassword123

# Database connection (test database)
DATABASE_URL=your_test_database_url
SUPABASE_URL=your_test_supabase_url
SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# API keys (can use test/mock keys)
OPENROUTER_API_KEY=your_test_api_key
```

**Important:** Use a separate test database, not your production database!

### 4. Create Test User

Before running tests, create a test user in your test database:

```sql
-- Example: Create test user in Supabase
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@example.com', crypt('testpassword123', gen_salt('bf')), NOW());
```

Or use your authentication service's admin panel to create the test user.

## Database Cleanup

E2E tests automatically clean up test data using global setup and teardown:

- **Global Setup** - Runs before all tests, verifies test user exists and cleans up any leftover data from previous runs
- **Global Teardown** - Runs after all tests complete, removes all test data created during the test run

### Manual Cleanup

Check test data status:
```bash
npm run test:e2e:status
```

Manually clean up test data:
```bash
npm run test:e2e:cleanup
```

This is useful if tests are interrupted or you need to reset the database.

### Per-Test Cleanup (Optional)

By default, cleanup happens only at the end of all tests. If you want to clean up after EACH test, use the cleanup fixture:

```typescript
import { test, expect } from './fixtures/cleanup-fixture';

test('my test', async ({ page }) => {
  // Your test code
  // Database will be cleaned up automatically after this test
});
```

This is useful when:
- Tests need complete isolation
- You're debugging specific test failures
- Tests have side effects that interfere with each other

**Note:** Per-test cleanup increases test execution time. Use only when necessary.

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

This will:
1. Run global setup (verify test user, clean existing data)
2. Execute all tests
3. Run global teardown (clean up created data)

### Run Specific Test File

```bash
npx playwright test flashcard-workflow.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

This opens Playwright's UI mode where you can:
- See tests running in real-time
- Time travel through test steps
- Debug failed tests
- Run individual tests

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

This opens the Playwright Inspector for step-by-step debugging.

### Run Single Test

```bash
npx playwright test --grep "should complete full flashcard generation"
```

## Test Structure

```
tests/e2e/
├── README.md                          # This file
├── config/
│   └── test-config.ts                # Test configuration and constants
├── pages/
│   ├── README.md                     # POM documentation
│   ├── index.ts                      # Barrel exports
│   ├── BasePage.ts                   # Base page class
│   ├── LoginPage.ts                  # Login page POM
│   ├── GeneratePage.ts               # Generate page POM
│   ├── FlashcardsPage.ts             # Flashcards page POM
│   └── components/
│       ├── ProposalCard.ts           # Proposal card component POM
│       └── FlashcardItem.ts          # Flashcard item component POM
├── flashcard-workflow.spec.ts        # Main workflow test
└── flashcard-generation.spec.ts      # Additional test scenarios
```

## Test Scenarios

### Main Workflow Test (`flashcard-workflow.spec.ts`)

**Test:** "should complete full flashcard generation and verification workflow"

Steps:
1. Navigate to generate page
2. Login with test credentials (if not authenticated)
3. Enter educational text and generate flashcards
4. Accept first proposal
5. Edit second proposal via modal
6. Reject third proposal
7. Save all accepted/edited flashcards
8. Navigate to flashcards page
9. Verify accepted flashcard exists
10. Verify edited flashcard exists
11. Verify rejected flashcard does NOT exist

**Test:** "should handle edge case: rejecting all proposals"

Verifies that Save All button is disabled when no proposals are accepted.

**Test:** "should validate minimum character requirement"

Verifies that the generate button is disabled when text is too short.

### Additional Tests (`flashcard-generation.spec.ts`)

- Full workflow with multiple proposals
- Accepting all proposals
- Rejecting all proposals
- Multiple edits on same proposal
- Character count validation

## Debugging Failed Tests

### 1. View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This shows:
- Test results
- Screenshots of failures
- Traces of failed tests
- Console logs

### 2. View Screenshots

Failed tests automatically capture screenshots in:
```
test-results/
```

### 3. View Traces

Traces are captured on first retry. View them with:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### 4. Use Playwright Inspector

Run with `--debug` flag to use the inspector:

```bash
npx playwright test --debug flashcard-workflow.spec.ts
```

## Writing New Tests

### 1. Use Page Object Model

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage } from "./pages";

test("my test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const generatePage = new GeneratePage(page);

  await loginPage.navigate();
  await loginPage.login("user@test.com", "password");
  // ... rest of test
});
```

### 2. Use Test Steps for Clarity

```typescript
test("my test", async ({ page }) => {
  await test.step("Login", async () => {
    // login logic
  });

  await test.step("Generate flashcards", async () => {
    // generation logic
  });
});
```

### 3. Use Test Configuration

```typescript
import { TestConfig } from "./config/test-config";

const { email, password } = TestConfig.auth;
const educationalText = TestConfig.sampleText.photosynthesis;
```

### 4. Add Assertions

```typescript
// Visibility
expect(await generatePage.isSuccessVisible()).toBe(true);

// Content
expect(await card.getStatus()).toContain("Accepted");

// Count
expect(await flashcardsPage.getFlashcardCount()).toBeGreaterThanOrEqual(2);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
        run: npm run test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Always use Page Object Model** - Don't use selectors directly in tests
2. **Use test data from config** - Centralize test data in `test-config.ts`
3. **Clean up after tests** - Reset database state between tests if needed
4. **Use meaningful test names** - Describe what the test verifies
5. **Add console.log for debugging** - Makes it easier to follow test flow
6. **Wait for elements** - Always wait for async operations to complete
7. **Use data-test-id** - More reliable than CSS selectors
8. **Test one thing at a time** - Keep tests focused and simple

## Troubleshooting

### Tests fail with "Target closed" error
- The page or context was closed prematurely
- Check for navigation issues or unexpected redirects
- Increase timeouts if needed

### Tests fail with "Element not found" error
- Element may not be visible yet
- Use `waitFor()` before interacting with elements
- Check if element has correct `data-test-id`

### Tests fail on CI but pass locally
- Check environment variables are set in CI
- Ensure test database is accessible from CI
- Verify BASE_URL is correct for CI environment

### Application not starting
- Check that dev server is running
- Verify port 4321 is not in use
- Check `.env.test` configuration

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
