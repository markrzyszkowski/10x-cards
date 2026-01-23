import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage, FlashcardsPage } from "./pages";
import { TestConfig } from "./config/test-config";

/**
 * E2E Test: Complete Flashcard Generation Workflow
 *
 * Scenario:
 * 1. Navigate to the application generate page
 * 2. Log in with E2E test user credentials (login page shown due to lack of session)
 * 3. Enter some educational text into text area and press generate button
 * 4. From returned options accept some, edit some via modal and reject some
 * 5. Press Save All button to be shown a success message
 * 6. Navigate to flashcards view
 * 7. Verify accepted and edited flashcards are there and rejected flashcards are not
 */

test.describe("Complete Flashcard Workflow", () => {
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

  test("should complete full flashcard generation and verification workflow", async ({ page }) => {
    // ===================================================================
    // STEP 1: Navigate to the application generate page
    // ===================================================================
    test.step("Navigate to generate page", async () => {
      await generatePage.navigate();
      await page.waitForLoadState("networkidle");
    });

    // ===================================================================
    // STEP 2: Log in with E2E test user credentials
    // (login page shown due to lack of session)
    // ===================================================================
    await test.step("Login with test credentials", async () => {
      // Check if redirected to login page due to no session
      if (page.url().includes("/login")) {
        await loginPage.verifyOnLoginPage();

        // Perform login
        await loginPage.fillEmail(TEST_EMAIL);
        await loginPage.fillPassword(TEST_PASSWORD);
        await loginPage.clickSubmit();

        // Wait for successful login and redirect to generate page
        await loginPage.waitForLoginSuccess();

        // Verify we're back on generate page after login
        await generatePage.verifyOnGeneratePage();
      }
    });

    // ===================================================================
    // STEP 3: Enter educational text and press generate button
    // ===================================================================
    await test.step("Enter educational text and generate flashcards", async () => {
      // Fill the source text textarea
      await generatePage.fillSourceText(EDUCATIONAL_TEXT);

      // Verify the generate button is enabled
      expect(await generatePage.isGenerateDisabled()).toBe(false);

      // Click generate button
      await generatePage.clickGenerate();

      // Wait for loading state to appear
      await generatePage.waitForLoading();
      expect(await generatePage.isLoading()).toBe(true);

      // Wait for proposals to load
      await generatePage.waitForProposals();
      expect(await generatePage.areProposalsVisible()).toBe(true);

      // Verify proposals were generated (3-10 expected)
      const proposalCount = await generatePage.getProposalCount();
      expect(proposalCount).toBeGreaterThanOrEqual(TestConfig.generation.minProposals);
      expect(proposalCount).toBeLessThanOrEqual(TestConfig.generation.maxProposals);

      console.log(`Generated ${proposalCount} flashcard proposals`);
    });

    // ===================================================================
    // STEP 4: Accept some, edit some, and reject some proposals
    // ===================================================================

    // Store original content for verification later
    let acceptedCard0Front: string;
    let acceptedCard0Back: string;
    let editedFront: string;
    let editedBack: string;
    let rejectedFront: string;

    await test.step("Accept first proposal", async () => {
      const card0 = generatePage.getProposalCard(0);

      // Get original content before accepting
      acceptedCard0Front = await card0.getFrontText();
      acceptedCard0Back = await card0.getBackText();

      console.log(`Accepting proposal 0: "${acceptedCard0Front}"`);

      // Accept the proposal
      await card0.accept();

      // Verify status changed to "Accepted"
      await card0.waitForStatus("Accepted");
      const status = await card0.getStatus();
      expect(status).toContain("Accepted");

      // Verify accept button is now disabled
      expect(await card0.isAcceptDisabled()).toBe(true);
    });

    await test.step("Edit second proposal via modal", async () => {
      const card1 = generatePage.getProposalCard(1);

      // Get original content
      const originalFront = await card1.getFrontText();
      const originalBack = await card1.getBackText();

      console.log(`Editing proposal 1: "${originalFront}"`);

      // Click edit button to open modal
      await card1.clickEdit();

      // Verify edit mode is visible
      expect(await card1.isInEditMode()).toBe(true);

      // Get current values in edit inputs
      const currentFront = await card1.getEditedFrontValue();
      const currentBack = await card1.getEditedBackValue();

      // Verify original values are loaded
      expect(currentFront).toBe(originalFront);
      expect(currentBack).toBe(originalBack);

      // Edit the content
      editedFront = `What is photosynthesis?`;
      editedBack = `Photosynthesis is the process by which plants convert light energy into chemical energy.`;

      await generatePage.editProposal(1, editedFront, editedBack);

      // Verify status changed to "Edited"
      await card1.waitForStatus("Edited");
      const status = await card1.getStatus();
      expect(status).toContain("Edited");

      // Verify the content was updated
      const updatedFront = await card1.getFrontText();
      const updatedBack = await card1.getBackText();
      expect(updatedFront).toBe(editedFront);
      expect(updatedBack).toBe(editedBack);

      console.log(`Edited proposal 1 to: "${editedFront}"`);
    });

    await test.step("Reject third proposal", async () => {
      const card2 = generatePage.getProposalCard(2);

      // Get content of proposal we're about to reject
      rejectedFront = await card2.getFrontText();

      console.log(`Rejecting proposal 2: "${rejectedFront}"`);

      // Reject the proposal
      await card2.reject();

      // Verify status changed to "Rejected"
      await card2.waitForStatus("Rejected");
      const status = await card2.getStatus();
      expect(status).toContain("Rejected");

      // Verify reject button is now disabled
      expect(await card2.isRejectDisabled()).toBe(true);
    });

    // ===================================================================
    // STEP 5: Press Save All button to be shown a success message
    // ===================================================================
    await test.step("Save all accepted and edited flashcards", async () => {
      // Verify Save All button is enabled (we have 2 accepted/edited)
      expect(await generatePage.isSaveAllEnabled()).toBe(true);

      console.log("Saving all accepted and edited flashcards...");

      // Click Save All button
      await generatePage.clickSaveAll();

      // Wait for success message
      await generatePage.waitForSuccess();

      // Verify success message is visible
      expect(await generatePage.isSuccessVisible()).toBe(true);

      // Get and verify success message content
      const successMessage = await generatePage.getSuccessMessage();
      expect(successMessage).toContain("Success");
      expect(successMessage).toContain("Successfully saved");
      expect(successMessage).toContain("2"); // 2 flashcards (1 accepted + 1 edited)

      console.log(`Success! ${successMessage}`);
    });

    // ===================================================================
    // STEP 6: Navigate to flashcards view
    // ===================================================================
    await test.step("Navigate to flashcards page", async () => {
      console.log("Navigating to flashcards page...");

      await flashcardsPage.navigate();
      await flashcardsPage.waitForFlashcardsToLoad();

      // Verify we're on the flashcards page
      await flashcardsPage.verifyOnFlashcardsPage();
      expect(await flashcardsPage.isFlashcardsListVisible()).toBe(true);
    });

    // ===================================================================
    // STEP 7: Verify accepted and edited flashcards are there,
    // and rejected flashcards are not
    // ===================================================================
    await test.step("Verify accepted flashcard exists", async () => {
      console.log(`Verifying accepted flashcard: "${acceptedCard0Front}"`);

      // Check if the accepted flashcard exists
      const hasAccepted = await flashcardsPage.hasFlashcardWithFront(acceptedCard0Front);
      expect(hasAccepted).toBe(true);

      // Get the flashcard and verify its content
      const flashcard = await flashcardsPage.getFlashcardByFrontText(acceptedCard0Front);
      expect(flashcard).not.toBeNull();

      if (flashcard) {
        // Expand to see back text
        await flashcard.expand();

        // Verify full content matches
        const isValid = await flashcard.verifyContent(acceptedCard0Front, acceptedCard0Back);
        expect(isValid).toBe(true);

        console.log("✓ Accepted flashcard verified successfully");
      }
    });

    await test.step("Verify edited flashcard exists", async () => {
      console.log(`Verifying edited flashcard: "${editedFront}"`);

      // Check if the edited flashcard exists
      const hasEdited = await flashcardsPage.hasFlashcardWithFront(editedFront);
      expect(hasEdited).toBe(true);

      // Get the flashcard and verify its content
      const flashcard = await flashcardsPage.getFlashcardByFrontText(editedFront);
      expect(flashcard).not.toBeNull();

      if (flashcard) {
        // Expand to see back text
        await flashcard.expand();

        // Verify full content matches edited values
        const isValid = await flashcard.verifyContent(editedFront, editedBack);
        expect(isValid).toBe(true);

        console.log("✓ Edited flashcard verified successfully");
      }
    });

    await test.step("Verify rejected flashcard does NOT exist", async () => {
      console.log(`Verifying rejected flashcard is absent: "${rejectedFront}"`);

      // Check that the rejected flashcard does NOT exist
      const hasRejected = await flashcardsPage.hasFlashcardWithFront(rejectedFront);
      expect(hasRejected).toBe(false);

      // Double-check using the verification method
      const isAbsent = await flashcardsPage.verifyFlashcardDoesNotExist(rejectedFront);
      expect(isAbsent).toBe(true);

      console.log("✓ Rejected flashcard correctly not found");
    });

    await test.step("Verify total flashcard count", async () => {
      // Get all flashcard front texts
      const allFronts = await flashcardsPage.getAllFrontTexts();
      console.log(`Total flashcards on page: ${allFronts.length}`);

      // We should have at least 2 flashcards (the ones we just saved)
      // Could be more if there were previous flashcards in the database
      const count = await flashcardsPage.getFlashcardCount();
      expect(count).toBeGreaterThanOrEqual(2);

      console.log("✓ Flashcard count verified");
    });

    // ===================================================================
    // Test Complete
    // ===================================================================
    console.log("\n✓ Complete workflow test passed successfully!");
  });

  test("should handle edge case: rejecting all proposals", async ({ page }) => {
    await test.step("Navigate and login", async () => {
      await generatePage.navigate();

      if (page.url().includes("/login")) {
        await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
        await loginPage.waitForLoginSuccess();
      }
    });

    await test.step("Generate flashcards", async () => {
      await generatePage.generateFlashcards(EDUCATIONAL_TEXT);
      await generatePage.waitForLoading();
      await generatePage.waitForProposals();
    });

    await test.step("Reject all proposals", async () => {
      const count = await generatePage.getProposalCount();

      for (let i = 0; i < count; i++) {
        await generatePage.rejectProposal(i);
      }
    });

    await test.step("Verify Save All is disabled", async () => {
      // Save All should be disabled when no flashcards are accepted
      expect(await generatePage.isSaveAllDisabled()).toBe(true);
      console.log("✓ Save All correctly disabled when all proposals rejected");
    });
  });

  test("should validate minimum character requirement", async ({ page }) => {
    await test.step("Navigate and login", async () => {
      await generatePage.navigate();

      if (page.url().includes("/login")) {
        await loginPage.login(TEST_EMAIL, TEST_PASSWORD);
        await loginPage.waitForLoginSuccess();
      }
    });

    await test.step("Try to generate with insufficient text", async () => {
      const shortText = "This text is way too short to generate flashcards.";

      await generatePage.fillSourceText(shortText);

      // Generate button should be disabled
      expect(await generatePage.isGenerateDisabled()).toBe(true);
      console.log("✓ Generate button correctly disabled for short text");
    });

    await test.step("Fill with valid length text", async () => {
      await generatePage.fillSourceText(EDUCATIONAL_TEXT);

      // Generate button should now be enabled
      expect(await generatePage.isGenerateDisabled()).toBe(false);
      console.log("✓ Generate button enabled for valid text length");
    });
  });
});
