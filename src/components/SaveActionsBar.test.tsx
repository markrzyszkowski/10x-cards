import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveActionsBar } from "./SaveActionsBar";

describe("SaveActionsBar", () => {
  const mockOnSaveAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("message display", () => {
    it('displays "No flashcards accepted yet" when count is 0', () => {
      render(<SaveActionsBar acceptedCount={0} onSaveAll={mockOnSaveAll} isSaving={false} />);

      expect(screen.getByText("No flashcards accepted yet")).toBeInTheDocument();
    });

    it("displays count with singular flashcard for 1 item", () => {
      render(<SaveActionsBar acceptedCount={1} onSaveAll={mockOnSaveAll} isSaving={false} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/flashcard ready to save/)).toBeInTheDocument();
    });

    it("displays count with plural flashcards for 2 items", () => {
      render(<SaveActionsBar acceptedCount={2} onSaveAll={mockOnSaveAll} isSaving={false} />);

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText(/flashcards ready to save/)).toBeInTheDocument();
    });

    it("displays count with plural flashcards for many items", () => {
      render(<SaveActionsBar acceptedCount={10} onSaveAll={mockOnSaveAll} isSaving={false} />);

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText(/flashcards ready to save/)).toBeInTheDocument();
    });
  });

  describe("button state", () => {
    it("is disabled when acceptedCount is 0", () => {
      render(<SaveActionsBar acceptedCount={0} onSaveAll={mockOnSaveAll} isSaving={false} />);

      const button = screen.getByRole("button", { name: /save all accepted/i });
      expect(button).toBeDisabled();
    });

    it("is enabled when acceptedCount is greater than 0 and not saving", () => {
      render(<SaveActionsBar acceptedCount={1} onSaveAll={mockOnSaveAll} isSaving={false} />);

      const button = screen.getByRole("button", { name: /save all accepted/i });
      expect(button).not.toBeDisabled();
    });

    it("is disabled when isSaving is true", () => {
      render(<SaveActionsBar acceptedCount={5} onSaveAll={mockOnSaveAll} isSaving={true} />);

      const button = screen.getByRole("button", { name: /saving/i });
      expect(button).toBeDisabled();
    });

    it("is disabled when both acceptedCount is 0 and isSaving is true", () => {
      render(<SaveActionsBar acceptedCount={0} onSaveAll={mockOnSaveAll} isSaving={true} />);

      const button = screen.getByRole("button", { name: /saving/i });
      expect(button).toBeDisabled();
    });
  });

  describe("button text", () => {
    it('shows "Save All Accepted" when not saving', () => {
      render(<SaveActionsBar acceptedCount={3} onSaveAll={mockOnSaveAll} isSaving={false} />);

      expect(screen.getByRole("button", { name: /save all accepted/i })).toBeInTheDocument();
    });

    it('shows "Saving..." when isSaving is true', () => {
      render(<SaveActionsBar acceptedCount={3} onSaveAll={mockOnSaveAll} isSaving={true} />);

      expect(screen.getByRole("button", { name: /saving/i })).toHaveTextContent("Saving...");
    });
  });

  describe("button interaction", () => {
    it("calls onSaveAll when button is clicked", async () => {
      const user = userEvent.setup();
      render(<SaveActionsBar acceptedCount={2} onSaveAll={mockOnSaveAll} isSaving={false} />);

      const button = screen.getByRole("button", { name: /save all accepted/i });
      await user.click(button);

      expect(mockOnSaveAll).toHaveBeenCalledTimes(1);
    });

    it("does not call onSaveAll when button is disabled", async () => {
      const user = userEvent.setup();
      render(<SaveActionsBar acceptedCount={0} onSaveAll={mockOnSaveAll} isSaving={false} />);

      const button = screen.getByRole("button", { name: /save all accepted/i });
      await user.click(button);

      expect(mockOnSaveAll).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles very large accepted count", () => {
      render(<SaveActionsBar acceptedCount={999} onSaveAll={mockOnSaveAll} isSaving={false} />);

      expect(screen.getByText("999")).toBeInTheDocument();
      expect(screen.getByText(/flashcards ready to save/)).toBeInTheDocument();
    });

    it("maintains disabled state during saving transition", () => {
      const { rerender } = render(<SaveActionsBar acceptedCount={5} onSaveAll={mockOnSaveAll} isSaving={false} />);

      let button = screen.getByRole("button", { name: /save all accepted/i });
      expect(button).not.toBeDisabled();

      rerender(<SaveActionsBar acceptedCount={5} onSaveAll={mockOnSaveAll} isSaving={true} />);

      button = screen.getByRole("button", { name: /saving/i });
      expect(button).toBeDisabled();
    });
  });
});
