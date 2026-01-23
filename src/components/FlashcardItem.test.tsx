import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardItem } from "./FlashcardItem";
import type { FlashcardDTO } from "../types";

const mockFlashcard: FlashcardDTO = {
  id: 1,
  front: "What is TypeScript?",
  back: "TypeScript is a typed superset of JavaScript",
  source: "ai-full",
  generation_id: 1,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

describe("FlashcardItem", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("source badge rendering", () => {
    it('displays "AI Generated" badge for ai-full source', () => {
      render(
        <FlashcardItem
          flashcard={{ ...mockFlashcard, source: "ai-full" }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("AI Generated")).toBeInTheDocument();
    });

    it('displays "AI Edited" badge for ai-edited source', () => {
      render(
        <FlashcardItem
          flashcard={{ ...mockFlashcard, source: "ai-edited" }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("AI Edited")).toBeInTheDocument();
    });

    it('displays "Manual" badge for manual source', () => {
      render(
        <FlashcardItem flashcard={{ ...mockFlashcard, source: "manual" }} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      expect(screen.getByText("Manual")).toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("formats created_at date correctly", () => {
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(/Created: Jan 15, 2024/)).toBeInTheDocument();
    });

    it("shows updated date when different from created date", () => {
      const updatedFlashcard = {
        ...mockFlashcard,
        updated_at: "2024-01-20T15:30:00Z",
      };

      render(<FlashcardItem flashcard={updatedFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByText(/Created: Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Updated: Jan 20, 2024/)).toBeInTheDocument();
    });

    it("does not show updated date when same as created date", () => {
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument();
    });
  });

  describe("expand/collapse interaction", () => {
    it("starts collapsed by default", () => {
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.queryByText(mockFlashcard.back)).not.toBeInTheDocument();
    });

    it("expands when clicked", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      await user.click(screen.getByText(mockFlashcard.front));

      expect(screen.getByText(mockFlashcard.back)).toBeInTheDocument();
    });

    it("collapses when clicked again", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      await user.click(screen.getByText(mockFlashcard.front));
      expect(screen.getByText(mockFlashcard.back)).toBeInTheDocument();

      await user.click(screen.getByText(mockFlashcard.front));
      expect(screen.queryByText(mockFlashcard.back)).not.toBeInTheDocument();
    });

    it("expands when Enter key is pressed", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const expandButton = screen.getByRole("button", { expanded: false });
      expandButton.focus();
      await user.keyboard("{Enter}");

      expect(screen.getByText(mockFlashcard.back)).toBeInTheDocument();
    });

    it("expands when Space key is pressed", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const expandButton = screen.getByRole("button", { expanded: false });
      expandButton.focus();
      await user.keyboard(" ");

      expect(screen.getByText(mockFlashcard.back)).toBeInTheDocument();
    });
  });

  describe("action buttons", () => {
    it("calls onEdit with flashcard when Edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      await user.click(screen.getByRole("button", { name: /edit flashcard/i }));

      expect(mockOnEdit).toHaveBeenCalledWith(mockFlashcard);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete with flashcard when Delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      await user.click(screen.getByRole("button", { name: /delete flashcard/i }));

      expect(mockOnDelete).toHaveBeenCalledWith(mockFlashcard);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes for expand/collapse", () => {
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const expandButton = screen.getByRole("button", { expanded: false });
      expect(expandButton).toHaveAttribute("aria-expanded", "false");
    });

    it("updates aria-expanded when expanded", async () => {
      const user = userEvent.setup();
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      const expandButton = screen.getByRole("button", { expanded: false });
      await user.click(expandButton);

      expect(expandButton).toHaveAttribute("aria-expanded", "true");
    });

    it("has accessible labels for action buttons", () => {
      render(<FlashcardItem flashcard={mockFlashcard} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

      expect(screen.getByRole("button", { name: /edit flashcard/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete flashcard/i })).toBeInTheDocument();
    });
  });
});
