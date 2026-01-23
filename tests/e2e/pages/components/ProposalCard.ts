import { Page, Locator } from "@playwright/test";

/**
 * Component Object Model for individual Proposal Card
 */
export class ProposalCard {
  private readonly card: Locator;
  private readonly statusBadge: Locator;
  private readonly frontText: Locator;
  private readonly backText: Locator;
  private readonly acceptButton: Locator;
  private readonly editButton: Locator;
  private readonly rejectButton: Locator;

  // Edit mode locators
  private readonly editCard: Locator;
  private readonly editFrontInput: Locator;
  private readonly editBackInput: Locator;
  private readonly editSaveButton: Locator;
  private readonly editCancelButton: Locator;

  constructor(
    private page: Page,
    private index: number
  ) {
    // Display mode locators
    this.card = page.locator(`[data-test-id="proposal-card-${index}"]`);
    this.statusBadge = page.locator(`[data-test-id="proposal-status-badge-${index}"]`);
    this.frontText = page.locator(`[data-test-id="proposal-front-text-${index}"]`);
    this.backText = page.locator(`[data-test-id="proposal-back-text-${index}"]`);
    this.acceptButton = page.locator(`[data-test-id="proposal-accept-button-${index}"]`);
    this.editButton = page.locator(`[data-test-id="proposal-edit-button-${index}"]`);
    this.rejectButton = page.locator(`[data-test-id="proposal-reject-button-${index}"]`);

    // Edit mode locators
    this.editCard = page.locator(`[data-test-id="proposal-edit-card-${index}"]`);
    this.editFrontInput = page.locator(`[data-test-id="proposal-edit-front-input-${index}"]`);
    this.editBackInput = page.locator(`[data-test-id="proposal-edit-back-input-${index}"]`);
    this.editSaveButton = page.locator(`[data-test-id="proposal-edit-save-button-${index}"]`);
    this.editCancelButton = page.locator(`[data-test-id="proposal-edit-cancel-button-${index}"]`);
  }

  /**
   * Get proposal index
   */
  getIndex(): number {
    return this.index;
  }

  /**
   * Check if card is visible
   */
  async isVisible(): Promise<boolean> {
    return this.card.isVisible();
  }

  /**
   * Get status badge text
   */
  async getStatus(): Promise<string> {
    return (await this.statusBadge.textContent()) || "";
  }

  /**
   * Get front text content
   */
  async getFrontText(): Promise<string> {
    return (await this.frontText.textContent()) || "";
  }

  /**
   * Get back text content
   */
  async getBackText(): Promise<string> {
    return (await this.backText.textContent()) || "";
  }

  /**
   * Click accept button
   */
  async accept(): Promise<void> {
    await this.acceptButton.click();
  }

  /**
   * Click reject button
   */
  async reject(): Promise<void> {
    await this.rejectButton.click();
  }

  /**
   * Click edit button to open edit mode
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
    await this.editCard.waitFor({ state: "visible" });
  }

  /**
   * Check if in edit mode
   */
  async isInEditMode(): Promise<boolean> {
    return this.editCard.isVisible();
  }

  /**
   * Edit proposal with new values
   */
  async edit(front: string, back: string): Promise<void> {
    // Only click edit if not already in edit mode
    const isEditing = await this.isInEditMode();
    if (!isEditing) {
      await this.clickEdit();
    }

    await this.editFrontInput.fill(front);
    await this.editBackInput.fill(back);
    await this.editSaveButton.click();
    // Wait for edit mode to close
    await this.editCard.waitFor({ state: "hidden" });
  }

  /**
   * Cancel editing
   */
  async cancelEdit(): Promise<void> {
    await this.editCancelButton.click();
    await this.editCard.waitFor({ state: "hidden" });
  }

  /**
   * Get edited front text value
   */
  async getEditedFrontValue(): Promise<string> {
    return (await this.editFrontInput.inputValue()) || "";
  }

  /**
   * Get edited back text value
   */
  async getEditedBackValue(): Promise<string> {
    return (await this.editBackInput.inputValue()) || "";
  }

  /**
   * Check if accept button is disabled
   */
  async isAcceptDisabled(): Promise<boolean> {
    return this.acceptButton.isDisabled();
  }

  /**
   * Check if edit button is disabled
   */
  async isEditDisabled(): Promise<boolean> {
    return this.editButton.isDisabled();
  }

  /**
   * Check if reject button is disabled
   */
  async isRejectDisabled(): Promise<boolean> {
    return this.rejectButton.isDisabled();
  }

  /**
   * Wait for status to change
   */
  async waitForStatus(expectedStatus: string): Promise<void> {
    await this.page.waitForFunction(
      ({ badge, status }) => {
        const element = document.querySelector(`[data-test-id="${badge}"]`);
        return element?.textContent?.includes(status);
      },
      { badge: `proposal-status-badge-${this.index}`, status: expectedStatus }
    );
  }
}
