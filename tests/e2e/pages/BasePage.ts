import { Page, Locator } from "@playwright/test";

/**
 * Base page class with common functionality for all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific URL
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "visible" });
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-test-id="${testId}"]`);
  }

  /**
   * Click element by test ID
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input by test ID
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  /**
   * Get text content by test ID
   */
  async getTextByTestId(testId: string): Promise<string> {
    return (await this.getByTestId(testId).textContent()) || "";
  }

  /**
   * Check if element is visible by test ID
   */
  async isVisibleByTestId(testId: string): Promise<boolean> {
    return this.getByTestId(testId).isVisible();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
