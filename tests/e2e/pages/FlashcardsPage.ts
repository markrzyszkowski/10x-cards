import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { FlashcardItem } from "./components/FlashcardItem";

/**
 * Page Object Model for the Flashcards page
 */
export class FlashcardsPage extends BasePage {
  // Flashcards list locator
  private readonly flashcardsList: Locator;

  constructor(page: Page) {
    super(page);
    this.flashcardsList = this.getByTestId("flashcards-list");
  }

  /**
   * Navigate to flashcards page
   */
  async navigate(): Promise<void> {
    await this.goto("/flashcards");
  }

  /**
   * Check if flashcards list is visible
   */
  async isFlashcardsListVisible(): Promise<boolean> {
    return this.flashcardsList.isVisible();
  }

  /**
   * Get flashcard item by ID
   */
  getFlashcardItem(flashcardId: number): FlashcardItem {
    return new FlashcardItem(this.page, flashcardId);
  }

  /**
   * Get all flashcard IDs currently displayed
   */
  async getFlashcardIds(): Promise<number[]> {
    const items = await this.page.locator('[data-test-id^="flashcard-item-"]').all();
    const ids: number[] = [];

    for (const item of items) {
      const testId = await item.getAttribute("data-test-id");
      if (testId) {
        const match = testId.match(/flashcard-item-(\d+)/);
        if (match) {
          ids.push(parseInt(match[1], 10));
        }
      }
    }

    return ids;
  }

  /**
   * Get number of flashcards displayed
   */
  async getFlashcardCount(): Promise<number> {
    const ids = await this.getFlashcardIds();
    return ids.length;
  }

  /**
   * Check if flashcard with specific ID exists
   */
  async hasFlashcard(flashcardId: number): Promise<boolean> {
    const item = this.getFlashcardItem(flashcardId);
    return item.isVisible();
  }

  /**
   * Check if flashcard with specific front text exists
   */
  async hasFlashcardWithFront(frontText: string): Promise<boolean> {
    const locator = this.page.locator('[data-test-id^="flashcard-front-text-"]', { hasText: frontText });
    return (await locator.count()) > 0;
  }

  /**
   * Get flashcard by front text
   */
  async getFlashcardByFrontText(frontText: string): Promise<FlashcardItem | null> {
    const locator = this.page.locator('[data-test-id^="flashcard-front-text-"]', { hasText: frontText });
    const count = await locator.count();

    if (count === 0) {
      return null;
    }

    const testId = await locator.first().getAttribute("data-test-id");
    if (!testId) {
      return null;
    }

    const match = testId.match(/flashcard-front-text-(\d+)/);
    if (!match) {
      return null;
    }

    const flashcardId = parseInt(match[1], 10);
    return this.getFlashcardItem(flashcardId);
  }

  /**
   * Verify flashcard exists with matching content
   */
  async verifyFlashcardExists(expectedFront: string, expectedBack?: string): Promise<boolean> {
    const flashcard = await this.getFlashcardByFrontText(expectedFront);
    if (!flashcard) {
      return false;
    }

    return flashcard.verifyContent(expectedFront, expectedBack);
  }

  /**
   * Verify flashcard does not exist
   */
  async verifyFlashcardDoesNotExist(frontText: string): Promise<boolean> {
    return !(await this.hasFlashcardWithFront(frontText));
  }

  /**
   * Wait for flashcards to load
   */
  async waitForFlashcardsToLoad(): Promise<void> {
    await this.flashcardsList.waitFor({ state: "visible" });
  }

  /**
   * Verify minimum number of flashcards
   */
  async verifyMinimumFlashcardCount(minCount: number): Promise<void> {
    const count = await this.getFlashcardCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Verify exact number of flashcards
   */
  async verifyExactFlashcardCount(expectedCount: number): Promise<void> {
    const count = await this.getFlashcardCount();
    expect(count).toBe(expectedCount);
  }

  /**
   * Get all flashcard items
   */
  async getAllFlashcards(): Promise<FlashcardItem[]> {
    const ids = await this.getFlashcardIds();
    return ids.map((id) => this.getFlashcardItem(id));
  }

  /**
   * Expand all flashcards to view their content
   */
  async expandAllFlashcards(): Promise<void> {
    const flashcards = await this.getAllFlashcards();
    for (const flashcard of flashcards) {
      if (!(await flashcard.isBackVisible())) {
        await flashcard.expand();
      }
    }
  }

  /**
   * Get all front texts
   */
  async getAllFrontTexts(): Promise<string[]> {
    const flashcards = await this.getAllFlashcards();
    const texts: string[] = [];

    for (const flashcard of flashcards) {
      texts.push(await flashcard.getFrontText());
    }

    return texts;
  }

  /**
   * Get all back texts (expands cards if needed)
   */
  async getAllBackTexts(): Promise<string[]> {
    const flashcards = await this.getAllFlashcards();
    const texts: string[] = [];

    for (const flashcard of flashcards) {
      if (!(await flashcard.isBackVisible())) {
        await flashcard.expand();
      }
      texts.push(await flashcard.getBackText());
    }

    return texts;
  }

  /**
   * Verify on flashcards page
   */
  async verifyOnFlashcardsPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/flashcards/);
  }
}
