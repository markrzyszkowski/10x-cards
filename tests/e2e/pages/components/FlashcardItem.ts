import { Page, Locator } from "@playwright/test";

/**
 * Component Object Model for individual Flashcard Item
 */
export class FlashcardItem {
  private readonly card: Locator;
  private readonly frontText: Locator;
  private readonly backText: Locator;

  constructor(
    private page: Page,
    private flashcardId: number
  ) {
    this.card = page.locator(`[data-test-id="flashcard-item-${flashcardId}"]`);
    this.frontText = page.locator(`[data-test-id="flashcard-front-text-${flashcardId}"]`);
    this.backText = page.locator(`[data-test-id="flashcard-back-text-${flashcardId}"]`);
  }

  /**
   * Get flashcard ID
   */
  getId(): number {
    return this.flashcardId;
  }

  /**
   * Check if card is visible
   */
  async isVisible(): Promise<boolean> {
    return this.card.isVisible();
  }

  /**
   * Get front text content
   */
  async getFrontText(): Promise<string> {
    return (await this.frontText.textContent()) || "";
  }

  /**
   * Get back text content (requires card to be expanded)
   */
  async getBackText(): Promise<string> {
    return (await this.backText.textContent()) || "";
  }

  /**
   * Check if front text is visible
   */
  async isFrontVisible(): Promise<boolean> {
    return this.frontText.isVisible();
  }

  /**
   * Check if back text is visible
   */
  async isBackVisible(): Promise<boolean> {
    return this.backText.isVisible();
  }

  /**
   * Expand card to show back text
   */
  async expand(): Promise<void> {
    // Click on the front text to expand it (the front text has the click handler)
    await this.frontText.click();
    // Wait for back text to be visible
    await this.backText.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Verify flashcard content matches expected values
   */
  async verifyContent(expectedFront: string, expectedBack?: string): Promise<boolean> {
    const actualFront = await this.getFrontText();
    if (actualFront !== expectedFront) {
      return false;
    }

    if (expectedBack !== undefined) {
      // Expand to see back text if not already visible
      if (!(await this.isBackVisible())) {
        await this.expand();
      }
      const actualBack = await this.getBackText();
      return actualBack === expectedBack;
    }

    return true;
  }

  /**
   * Wait for card to be visible
   */
  async waitForVisible(): Promise<void> {
    await this.card.waitFor({ state: "visible" });
  }
}
