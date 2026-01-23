# Testing Documentation

This directory contains all test files for the 10x Cards application.

## Directory Structure

```
tests/
├── setup.ts              # Vitest global setup configuration
├── unit/                 # Unit tests for isolated functions and modules
├── integration/          # Integration tests for API endpoints and services
└── e2e/                  # End-to-end tests using Playwright
```

## Test Types

### Unit Tests (Vitest)

Unit tests are located in `tests/unit/` and test individual functions, components, and services in isolation.

**Run unit tests:**

```bash
npm test                  # Run in watch mode
npm run test:run          # Run once
npm run test:ui           # Run with UI
npm run test:coverage     # Run with coverage report
```

**Example test structure:**

```typescript
// tests/unit/services/flashcard.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flashcardService } from '@/lib/services/flashcard.service';

describe('FlashcardService', () => {
  it('should create flashcards', async () => {
    // Test implementation
  });
});
```

### Integration Tests (Vitest)

Integration tests are located in `tests/integration/` and test interactions between components, services, and APIs.

**Run integration tests:**

```bash
npm test                  # Runs all tests including integration
npm run test:run          # Run once
```

**Example test structure:**

```typescript
// tests/integration/api/flashcards.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/flashcards', () => {
  it('should create flashcards for authenticated user', async () => {
    // Test implementation
  });
});
```

### End-to-End Tests (Playwright)

E2E tests are located in `tests/e2e/` and test complete user workflows from the browser perspective.

**Run E2E tests:**

```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:debug    # Run in debug mode
npm run test:e2e:report   # Show test report
```

**Example test structure:**

```typescript
// tests/e2e/flashcard-generation.spec.ts
import { test, expect } from '@playwright/test';

test('generates flashcards from source text', async ({ page }) => {
  await page.goto('/generate');
  await page.fill('textarea', 'Source text...');
  await page.click('button:has-text("Generate")');
  await expect(page.locator('.proposal')).toBeVisible();
});
```

## Test Configuration

### Vitest Configuration

Configuration is in `vitest.config.ts`:

- **Environment**: jsdom for React component testing
- **Coverage**: 80% threshold for service layer
- **Setup**: Global test utilities and mocks in `tests/setup.ts`

### Playwright Configuration

Configuration is in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Base URL**: http://localhost:4321
- **Auto-start dev server**: Yes

## Coverage Targets

Based on the test plan:

- Service layer: **80%+**
- API endpoints: **90%+**
- Utilities: **80%+**
- React components: **70%+**

## Best Practices

### Unit Tests

1. **Isolation**: Mock external dependencies
2. **AAA Pattern**: Arrange, Act, Assert
3. **Descriptive names**: Use clear test descriptions
4. **One assertion per test**: Keep tests focused

### Integration Tests

1. **Test interactions**: Verify component communication
2. **Mock external services**: Use MSW for API mocking
3. **Test error paths**: Include error scenarios

### E2E Tests

1. **Test user workflows**: Complete user journeys
2. **Use data-testid**: For reliable selectors
3. **Avoid timeouts**: Use Playwright auto-waiting
4. **Clean state**: Reset state between tests

## Mocking

### Supabase Client

```typescript
import { vi } from 'vitest';

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
};
```

### OpenRouter API

Use MSW for mocking external API calls:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({ choices: [{ message: { content: '{}' } }] });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Running Tests in CI

Tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm run test:run

- name: Run E2E tests
  run: npm run test:e2e
```

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test -- flashcard.service.test.ts

# Run tests matching pattern
npm test -- --grep "create flashcards"

# Debug in VS Code
# Add breakpoint and use "Debug Test" in Test Explorer
```

### E2E Tests

```bash
# Debug mode (opens browser with DevTools)
npm run test:e2e:debug

# Run specific test
npm run test:e2e -- flashcard-generation.spec.ts

# Run in headed mode
npm run test:e2e -- --headed
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Test Plan](./.ai/test-plan.md)