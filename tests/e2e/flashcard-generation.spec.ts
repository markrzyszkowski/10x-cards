import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage, FlashcardsPage } from "./pages";
import { TestConfig } from "./config/test-config";

/**
 * E2E test for flashcard generation workflow
 *
 * Test scenario:
 * 1. Navigate to generate page (redirects to login if not authenticated)
 * 2. Login with E2E test user credentials
 * 3. Enter educational text and generate flashcards
 * 4. Accept some proposals, edit some, and reject some
 * 5. Save all accepted/edited flashcards
 * 6. Navigate to flashcards page
 * 7. Verify accepted and edited flashcards exist, rejected ones don't
 */

test.describe("Flashcard Generation E2E", () => {
  const { email: TEST_EMAIL, password: TEST_PASSWORD } = TestConfig.auth;
  const EDUCATIONAL_TEXT = TestConfig.sampleText.photosynthesis;

  let loginPage: LoginPage;
  let generatePage: GeneratePage;
  let flashcardsPage: FlashcardsPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    generatePage = new GeneratePage(page);
    flashcardsPage = new FlashcardsPage(page);
  });

  test("should complete full flashcard generation workflow", async ({ page }) => {
    // Step 1: Navigate to generate page
    await generatePage.navigate();

    // Step 2: Login if redirected to login page
    if (page.url().includes("/login")) {
      await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
      await loginPage.waitForLoginSuccess();
    }

    // Verify we're on the generate page
    await generatePage.verifyOnGeneratePage();

    // Step 3: Generate flashcards from educational text
    await generatePage.generateFlashcards(EDUCATIONAL_TEXT);
    await generatePage.waitForLoading();
    await generatePage.waitForProposals();

    // Verify proposals were generated
    const proposalCount = await generatePage.getProposalCount();
    expect(proposalCount).toBeGreaterThanOrEqual(TestConfig.generation.minProposals);
    expect(proposalCount).toBeLessThanOrEqual(TestConfig.generation.maxProposals);

    // Step 4: Interact with proposals
    // Accept first proposal
    await generatePage.acceptProposal(0);
    const card0 = generatePage.getProposalCard(0);
    expect(await card0.getStatus()).toContain("Accepted");

    // Edit second proposal
    const card1 = generatePage.getProposalCard(1);
    const originalFront = await card1.getFrontText();
    const originalBack = await card1.getBackText();
    const editedFront = `Edited: ${originalFront}`;
    const editedBack = `Edited: ${originalBack}`;
    await generatePage.editProposal(1, editedFront, editedBack);
    expect(await card1.getStatus()).toContain("Edited");

    // Reject third proposal
    await generatePage.rejectProposal(2);
    const card2 = generatePage.getProposalCard(2);
    expect(await card2.getStatus()).toContain("Rejected");

    // Capture the front text of accepted/edited proposals for later verification
    const acceptedFront = await card0.getFrontText();
    const acceptedBack = await card0.getBackText();

    // Step 5: Save all accepted/edited flashcards
    expect(await generatePage.isSaveAllEnabled()).toBe(true);
    await generatePage.clickSaveAll();
    await generatePage.waitForSuccess();

    // Verify success message
    expect(await generatePage.isSuccessVisible()).toBe(true);
    const successMessage = await generatePage.getSuccessMessage();
    expect(successMessage).toContain("Successfully saved");
    expect(successMessage).toContain("2"); // 2 flashcards (1 accepted + 1 edited)

    // Step 6: Navigate to flashcards page
    await flashcardsPage.navigate();
    await flashcardsPage.waitForFlashcardsToLoad();

    // Step 7: Verify flashcards
    // Verify accepted flashcard exists
    const hasAccepted = await flashcardsPage.verifyFlashcardExists(acceptedFront, acceptedBack);
    expect(hasAccepted).toBe(true);

    // Verify edited flashcard exists
    const hasEdited = await flashcardsPage.verifyFlashcardExists(editedFront, editedBack);
    expect(hasEdited).toBe(true);

    // Verify rejected flashcard does NOT exist
    const rejectedFront = await card2.getFrontText();
    const hasRejected = await flashcardsPage.verifyFlashcardDoesNotExist(rejectedFront);
    expect(hasRejected).toBe(true);
  });

  test("should handle accepting all proposals", async ({ page }) => {
    await generatePage.navigate();

    // Login if needed
    if (page.url().includes("/login")) {
      await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
      await loginPage.waitForLoginSuccess();
    }

    // Generate flashcards
    await generatePage.generateFlashcards(EDUCATIONAL_TEXT);
    await generatePage.waitForLoading();
    await generatePage.waitForProposals();

    const proposalCount = await generatePage.getProposalCount();

    // Accept all proposals
    const acceptIndices = Array.from({ length: proposalCount }, (_, i) => i);
    await generatePage.acceptProposals(acceptIndices);

    // Save all
    await generatePage.clickSaveAll();
    await generatePage.waitForSuccess();

    // Verify all were saved
    const successMessage = await generatePage.getSuccessMessage();
    expect(successMessage).toContain(String(proposalCount));
  });

  test("should handle rejecting all proposals", async ({ page }) => {
    await generatePage.navigate();

    // Login if needed
    if (page.url().includes("/login")) {
      await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
      await loginPage.waitForLoginSuccess();
    }

    // Generate flashcards
    await generatePage.generateFlashcards(EDUCATIONAL_TEXT);
    await generatePage.waitForLoading();
    await generatePage.waitForProposals();

    const proposalCount = await generatePage.getProposalCount();

    // Reject all proposals
    const rejectIndices = Array.from({ length: proposalCount }, (_, i) => i);
    await generatePage.rejectProposals(rejectIndices);

    // Save all button should be disabled
    expect(await generatePage.isSaveAllDisabled()).toBe(true);
  });

  test("should allow editing proposals multiple times", async ({ page }) => {
    await generatePage.navigate();

    // Login if needed
    if (page.url().includes("/login")) {
      await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
      await loginPage.waitForLoginSuccess();
    }

    // Generate flashcards
    await generatePage.generateFlashcards(EDUCATIONAL_TEXT);
    await generatePage.waitForLoading();
    await generatePage.waitForProposals();

    const card = generatePage.getProposalCard(0);

    // First edit
    await card.edit("First edit front", "First edit back");
    expect(await card.getStatus()).toContain("Edited");
    expect(await card.getFrontText()).toBe("First edit front");

    // Second edit
    await card.edit("Second edit front", "Second edit back");
    expect(await card.getStatus()).toContain("Edited");
    expect(await card.getFrontText()).toBe("Second edit front");
  });

  test("should validate minimum character count", async ({ page }) => {
    await generatePage.navigate();

    // Login if needed
    if (page.url().includes("/login")) {
      await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
      await loginPage.waitForLoginSuccess();
    }

    // Try to generate with text that's too short (less than 1000 chars)
    const shortText = "This is too short.";
    await generatePage.fillSourceText(shortText);

    // Generate button should be disabled
    expect(await generatePage.isGenerateDisabled()).toBe(true);
  });
});
