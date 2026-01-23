# Page Object Model (POM) Documentation

This directory contains Page Object Model classes for E2E testing with Playwright.

## Overview

The Page Object Model pattern separates test logic from page-specific code, making tests more maintainable and reusable.

## Structure

```
pages/
├── BasePage.ts              # Base class with common functionality
├── LoginPage.ts             # Login page object
├── GeneratePage.ts          # Generate flashcards page object
├── FlashcardsPage.ts        # Flashcards list page object
├── components/
│   ├── ProposalCard.ts      # Individual proposal card component
│   └── FlashcardItem.ts     # Individual flashcard item component
└── index.ts                 # Barrel export for easy imports
```

## Usage

### Import Page Objects

```typescript
import { LoginPage, GeneratePage, FlashcardsPage } from "./pages";
```

### Initialize Page Objects

```typescript
test("example test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const generatePage = new GeneratePage(page);
  const flashcardsPage = new FlashcardsPage(page);
});
```

### Common Patterns

#### Login Flow

```typescript
const loginPage = new LoginPage(page);
await loginPage.navigate();
await loginPage.login("user@example.com", "password123");
await loginPage.waitForLoginSuccess();
```

#### Generate Flashcards

```typescript
const generatePage = new GeneratePage(page);
await generatePage.navigate();
await generatePage.generateFlashcards(educationalText);
await generatePage.waitForLoading();
await generatePage.waitForProposals();
```

#### Interact with Proposals

```typescript
// Accept a proposal
await generatePage.acceptProposal(0);

// Edit a proposal
await generatePage.editProposal(1, "New front", "New back");

// Reject a proposal
await generatePage.rejectProposal(2);

// Work with proposal card directly
const card = generatePage.getProposalCard(0);
await card.accept();
expect(await card.getStatus()).toContain("Accepted");
```

#### Save Flashcards

```typescript
await generatePage.clickSaveAll();
await generatePage.waitForSuccess();
expect(await generatePage.isSuccessVisible()).toBe(true);
```

#### Verify Flashcards

```typescript
const flashcardsPage = new FlashcardsPage(page);
await flashcardsPage.navigate();
await flashcardsPage.waitForFlashcardsToLoad();

// Check if flashcard exists
const exists = await flashcardsPage.verifyFlashcardExists("Front text", "Back text");
expect(exists).toBe(true);

// Get flashcard count
const count = await flashcardsPage.getFlashcardCount();
expect(count).toBeGreaterThan(0);
```

## Page Objects Reference

### BasePage

Base class providing common functionality:

- `goto(path)` - Navigate to URL
- `getByTestId(testId)` - Get element by data-test-id
- `clickByTestId(testId)` - Click element by data-test-id
- `fillByTestId(testId, value)` - Fill input by data-test-id
- `waitForNavigation(url)` - Wait for URL change

### LoginPage

Methods:
- `navigate()` - Go to login page
- `login(email, password)` - Complete login
- `fillEmail(email)` - Fill email field
- `fillPassword(password)` - Fill password field
- `clickSubmit()` - Click submit button
- `waitForLoginSuccess()` - Wait for redirect after login
- `isErrorVisible()` - Check for error alert
- `getErrorMessage()` - Get error text

### GeneratePage

Methods:
- `navigate()` - Go to generate page
- `fillSourceText(text)` - Fill source textarea
- `generateFlashcards(text)` - Fill and submit
- `waitForLoading()` - Wait for loading state
- `waitForProposals()` - Wait for proposals to load
- `getProposalCard(index)` - Get specific proposal
- `getProposalCount()` - Count proposals
- `acceptProposal(index)` - Accept by index
- `editProposal(index, front, back)` - Edit by index
- `rejectProposal(index)` - Reject by index
- `clickSaveAll()` - Save all accepted/edited
- `waitForSuccess()` - Wait for success message
- `isSuccessVisible()` - Check success state

### FlashcardsPage

Methods:
- `navigate()` - Go to flashcards page
- `waitForFlashcardsToLoad()` - Wait for list
- `getFlashcardItem(id)` - Get specific flashcard
- `getFlashcardIds()` - Get all IDs
- `getFlashcardCount()` - Count flashcards
- `hasFlashcard(id)` - Check if ID exists
- `hasFlashcardWithFront(text)` - Find by front text
- `verifyFlashcardExists(front, back?)` - Verify content
- `verifyFlashcardDoesNotExist(front)` - Verify absence
- `getAllFrontTexts()` - Get all front texts
- `getAllBackTexts()` - Get all back texts (expands cards)

### ProposalCard Component

Methods:
- `isVisible()` - Check visibility
- `getStatus()` - Get status badge text
- `getFrontText()` - Get front content
- `getBackText()` - Get back content
- `accept()` - Click accept button
- `reject()` - Click reject button
- `clickEdit()` - Open edit mode
- `edit(front, back)` - Edit and save
- `cancelEdit()` - Cancel editing
- `isInEditMode()` - Check edit state
- `waitForStatus(status)` - Wait for status change

### FlashcardItem Component

Methods:
- `isVisible()` - Check visibility
- `getFrontText()` - Get front content
- `getBackText()` - Get back content (must be expanded)
- `expand()` - Expand to show back
- `verifyContent(front, back?)` - Verify matches

## Test Data IDs

All components use `data-test-id` attributes for reliable element selection:

### Login
- `login-email-input`
- `login-password-input`
- `login-submit-button`
- `login-error-alert`

### Generate
- `generate-source-textarea`
- `generate-submit-button`
- `generate-loading-state`
- `proposals-list`
- `proposals-save-all-button`
- `generate-success-message`

### Proposals (indexed)
- `proposal-card-{index}`
- `proposal-status-badge-{index}`
- `proposal-front-text-{index}`
- `proposal-back-text-{index}`
- `proposal-accept-button-{index}`
- `proposal-edit-button-{index}`
- `proposal-reject-button-{index}`
- `proposal-edit-card-{index}`
- `proposal-edit-front-input-{index}`
- `proposal-edit-back-input-{index}`
- `proposal-edit-save-button-{index}`
- `proposal-edit-cancel-button-{index}`

### Flashcards (by ID)
- `flashcards-list`
- `flashcard-item-{id}`
- `flashcard-front-text-{id}`
- `flashcard-back-text-{id}`

## Best Practices

1. **Always use POM classes** instead of direct selectors in tests
2. **Initialize page objects in beforeEach** for clean state
3. **Use meaningful method names** that describe user actions
4. **Chain related actions** for better readability
5. **Wait for state changes** before assertions
6. **Reuse components** like ProposalCard for DRY tests
7. **Use test IDs** for reliable element selection

## Example Complete Test

See `flashcard-generation.spec.ts` for a comprehensive example of using all POM classes together.
