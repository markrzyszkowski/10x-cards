import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ProposalCard } from "./components/ProposalCard";

/**
 * Page Object Model for the Generate page
 */
export class GeneratePage extends BasePage {
  // Generation Form locators
  private readonly sourceTextarea: Locator;
  private readonly generateButton: Locator;

  // Loading state locator
  private readonly loadingState: Locator;

  // Proposals list locators
  private readonly proposalsList: Locator;
  private readonly saveAllButton: Locator;

  // Success message locators
  private readonly successMessage: Locator;
  private readonly startOverButton: Locator;

  constructor(page: Page) {
    super(page);

    // Generation form
    this.sourceTextarea = this.getByTestId("generate-source-textarea");
    this.generateButton = this.getByTestId("generate-submit-button");

    // Loading state
    this.loadingState = this.getByTestId("generate-loading-state");

    // Proposals list
    this.proposalsList = this.getByTestId("proposals-list");
    this.saveAllButton = this.getByTestId("proposals-save-all-button");

    // Success message
    this.successMessage = this.getByTestId("generate-success-message");
    this.startOverButton = this.getByTestId("generate-start-over-button");
  }

  /**
   * Navigate to generate page
   */
  async navigate(): Promise<void> {
    await this.goto("/generate");
    // Wait for page to be fully loaded
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Fill source text textarea
   */
  async fillSourceText(text: string): Promise<void> {
    // Wait for textarea to be ready and ensure only one is present
    await this.sourceTextarea.waitFor({ state: "visible", timeout: 10000 });
    // Clear existing content first
    await this.sourceTextarea.clear();
    // Fill with new text
    await this.sourceTextarea.fill(text);
  }

  /**
   * Click generate button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Generate flashcards from source text
   */
  async generateFlashcards(sourceText: string): Promise<void> {
    await this.fillSourceText(sourceText);
    await this.clickGenerate();
  }

  /**
   * Wait for loading state to appear
   */
  async waitForLoading(): Promise<void> {
    await this.loadingState.waitFor({ state: "visible" });
  }

  /**
   * Wait for loading to complete and proposals to appear
   */
  async waitForProposals(): Promise<void> {
    await this.loadingState.waitFor({ state: "hidden" });
    await this.proposalsList.waitFor({ state: "visible" });
  }

  /**
   * Check if loading state is visible
   */
  async isLoading(): Promise<boolean> {
    return this.loadingState.isVisible();
  }

  /**
   * Check if proposals list is visible
   */
  async areProposalsVisible(): Promise<boolean> {
    return this.proposalsList.isVisible();
  }

  /**
   * Get proposal card by index
   */
  getProposalCard(index: number): ProposalCard {
    return new ProposalCard(this.page, index);
  }

  /**
   * Get all proposal cards
   */
  async getProposalCards(): Promise<ProposalCard[]> {
    const count = await this.getProposalCount();
    const cards: ProposalCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(new ProposalCard(this.page, i));
    }
    return cards;
  }

  /**
   * Get number of proposals
   */
  async getProposalCount(): Promise<number> {
    // Count all proposal cards
    const cards = await this.page.locator('[data-test-id^="proposal-card-"]').count();
    return cards;
  }

  /**
   * Accept proposal by index
   */
  async acceptProposal(index: number): Promise<void> {
    const card = this.getProposalCard(index);
    await card.accept();
    await card.waitForStatus("Accepted");
  }

  /**
   * Reject proposal by index
   */
  async rejectProposal(index: number): Promise<void> {
    const card = this.getProposalCard(index);
    await card.reject();
    await card.waitForStatus("Rejected");
  }

  /**
   * Edit proposal by index
   */
  async editProposal(index: number, front: string, back: string): Promise<void> {
    const card = this.getProposalCard(index);
    await card.edit(front, back);
    await card.waitForStatus("Edited");
  }

  /**
   * Accept multiple proposals by indices
   */
  async acceptProposals(indices: number[]): Promise<void> {
    for (const index of indices) {
      await this.acceptProposal(index);
    }
  }

  /**
   * Reject multiple proposals by indices
   */
  async rejectProposals(indices: number[]): Promise<void> {
    for (const index of indices) {
      await this.rejectProposal(index);
    }
  }

  /**
   * Click save all button
   */
  async clickSaveAll(): Promise<void> {
    await this.saveAllButton.click();
  }

  /**
   * Check if save all button is enabled
   */
  async isSaveAllEnabled(): Promise<boolean> {
    return this.saveAllButton.isEnabled();
  }

  /**
   * Check if save all button is disabled
   */
  async isSaveAllDisabled(): Promise<boolean> {
    return this.saveAllButton.isDisabled();
  }

  /**
   * Wait for success message to appear
   */
  async waitForSuccess(): Promise<void> {
    await this.successMessage.waitFor({ state: "visible" });
  }

  /**
   * Check if success message is visible
   */
  async isSuccessVisible(): Promise<boolean> {
    return this.successMessage.isVisible();
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return (await this.successMessage.textContent()) || "";
  }

  /**
   * Click start over button
   */
  async clickStartOver(): Promise<void> {
    await this.startOverButton.click();
  }

  /**
   * Complete full generation workflow
   * @param sourceText - The text to generate flashcards from
   * @param acceptIndices - Indices of proposals to accept
   * @param editActions - Array of { index, front, back } for proposals to edit
   * @param rejectIndices - Indices of proposals to reject
   */
  async completeGenerationWorkflow(
    sourceText: string,
    acceptIndices: number[] = [],
    editActions: Array<{ index: number; front: string; back: string }> = [],
    rejectIndices: number[] = []
  ): Promise<void> {
    await this.generateFlashcards(sourceText);
    await this.waitForLoading();
    await this.waitForProposals();

    // Accept proposals
    for (const index of acceptIndices) {
      await this.acceptProposal(index);
    }

    // Edit proposals
    for (const { index, front, back } of editActions) {
      await this.editProposal(index, front, back);
    }

    // Reject proposals
    for (const index of rejectIndices) {
      await this.rejectProposal(index);
    }

    // Save all
    await this.clickSaveAll();
    await this.waitForSuccess();
  }

  /**
   * Check if generate button is disabled
   */
  async isGenerateDisabled(): Promise<boolean> {
    return this.generateButton.isDisabled();
  }

  /**
   * Verify on generate page
   */
  async verifyOnGeneratePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/generate/);
  }
}
