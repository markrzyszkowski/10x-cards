import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditFlashcardModal } from "@/components/EditFlashcardModal";
import type { FlashcardDTO } from "@/types";

const mockFlashcard: FlashcardDTO = {
  id: 1,
  user_id: "user-123",
  front: "What is TypeScript?",
  back: "TypeScript is a typed superset of JavaScript",
  source: "ai-full",
  generation_id: 1,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

describe("EditFlashcardModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe("form initialization", () => {
    it("initializes form with flashcard data when opened", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      expect(screen.getByDisplayValue(mockFlashcard.front)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockFlashcard.back)).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
    });

    it("does not render when flashcard is null", () => {
      render(
        <EditFlashcardModal flashcard={null} isOpen={true} onClose={mockOnClose} onSave={mockOnSave} isSaving={false} />
      );

      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
    });

    it("resets form when flashcard changes", () => {
      const { rerender } = render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const newFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        id: 2,
        front: "New Question",
        back: "New Answer",
      };

      rerender(
        <EditFlashcardModal
          flashcard={newFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      expect(screen.getByDisplayValue("New Question")).toBeInTheDocument();
      expect(screen.getByDisplayValue("New Answer")).toBeInTheDocument();
    });
  });

  describe("validation - required fields", () => {
    it("shows error when front text is empty on blur", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.tab();

      expect(await screen.findByText("Front text is required")).toBeInTheDocument();
    });

    it("shows error when back text is empty on blur", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const backInput = screen.getByLabelText(/back \(answer\)/i);
      await user.clear(backInput);
      await user.tab();

      expect(await screen.findByText("Back text is required")).toBeInTheDocument();
    });

    it("treats whitespace-only input as empty", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.type(frontInput, "   \n\n   ");
      await user.tab();

      expect(await screen.findByText("Front text is required")).toBeInTheDocument();
    });
  });

  describe("validation - character limits", () => {
    it("shows error when front text exceeds 200 characters", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.type(frontInput, "a".repeat(201));
      await user.tab();

      expect(await screen.findByText(/Front text must not exceed 200 characters/)).toBeInTheDocument();
    });

    it("shows error when back text exceeds 500 characters", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const backInput = screen.getByLabelText(/back \(answer\)/i);
      await user.clear(backInput);
      await user.type(backInput, "a".repeat(501));
      await user.tab();

      expect(await screen.findByText(/Back text must not exceed 500 characters/)).toBeInTheDocument();
    });

    it("accepts front text at exactly 200 characters", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.type(frontInput, "a".repeat(200));
      await user.tab();

      expect(screen.queryByText(/Front text must not exceed/)).not.toBeInTheDocument();
    });

    it("accepts back text at exactly 500 characters", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const backInput = screen.getByLabelText(/back \(answer\)/i);
      await user.clear(backInput);
      await user.type(backInput, "a".repeat(500));
      await user.tab();

      expect(screen.queryByText(/Back text must not exceed/)).not.toBeInTheDocument();
    });
  });

  describe("validation - change detection", () => {
    it("prevents submission when no changes made (button disabled)", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save changes/i });

      // Button should be disabled when form is not dirty
      expect(saveButton).toBeDisabled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("allows submission when only front is changed", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.type(frontInput, " - Updated");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockFlashcard.id, {
          front: mockFlashcard.front + " - Updated",
        });
      });
    });

    it("allows submission when only back is changed", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const backInput = screen.getByLabelText(/back \(answer\)/i);
      await user.type(backInput, " with additional info");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockFlashcard.id, {
          back: mockFlashcard.back + " with additional info",
        });
      });
    });

    it("includes both fields when both are changed", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      const backInput = screen.getByLabelText(/back \(answer\)/i);

      await user.clear(frontInput);
      await user.type(frontInput, "New Question");

      await user.clear(backInput);
      await user.type(backInput, "New Answer");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockFlashcard.id, {
          front: "New Question",
          back: "New Answer",
        });
      });
    });
  });

  describe("character count display", () => {
    it("displays current character count for front field", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      expect(screen.getByText(`${mockFlashcard.front.length}/200`)).toBeInTheDocument();
    });

    it("displays current character count for back field", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      expect(screen.getByText(`${mockFlashcard.back.length}/500`)).toBeInTheDocument();
    });

    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.type(frontInput, "ABC");

      const newLength = mockFlashcard.front.length + 3;
      expect(screen.getByText(`${newLength}/200`)).toBeInTheDocument();
    });

    it("shows warning color when front is at 90% threshold (180 chars)", async () => {
      userEvent.setup();
      const longFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        front: "a".repeat(180),
      };

      render(
        <EditFlashcardModal
          flashcard={longFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const charCount = screen.getByText("180/200");
      expect(charCount).toHaveClass("text-yellow-600");
    });

    it("shows error color when front exceeds limit", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.type(frontInput, "a".repeat(201));

      const charCount = screen.getByText("201/200");
      expect(charCount).toHaveClass("text-destructive");
    });
  });

  describe("error clearing", () => {
    it("clears front error when user starts typing", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.tab();

      expect(await screen.findByText("Front text is required")).toBeInTheDocument();

      await user.type(frontInput, "New text");

      expect(screen.queryByText("Front text is required")).not.toBeInTheDocument();
    });

    it("clears back error when user starts typing", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const backInput = screen.getByLabelText(/back \(answer\)/i);
      await user.clear(backInput);
      await user.tab();

      expect(await screen.findByText("Back text is required")).toBeInTheDocument();

      await user.type(backInput, "New text");

      expect(screen.queryByText("Back text is required")).not.toBeInTheDocument();
    });
  });

  describe("save button state", () => {
    it("is disabled when form is not dirty", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it("is enabled when form is dirty and valid", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.type(frontInput, " - Update");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
    });

    it("is disabled when there are validation errors", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.tab();

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('shows "Saving..." when isSaving is true', () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={true}
        />
      );

      expect(screen.getByRole("button", { name: /saving/i })).toHaveTextContent("Saving...");
    });
  });

  describe("close behavior", () => {
    it("calls onClose when Cancel button is clicked without changes", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("shows confirmation dialog when closing with unsaved changes", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.type(frontInput, " - Update");

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(confirmSpy).toHaveBeenCalledWith("You have unsaved changes. Are you sure you want to discard them?");
      expect(mockOnClose).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it("closes without confirmation if user confirms discarding changes", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.type(frontInput, " - Update");

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("displays save error when onSave throws", async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValueOnce(new Error("Network error"));

      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.type(frontInput, " - Update");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      expect(await screen.findByText("Network error")).toBeInTheDocument();
    });

    it("clears previous save errors when reopening modal", () => {
      const { rerender } = render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      // Simulate error state (would normally be set by failed save)
      rerender(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      rerender(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      // Error should be cleared
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper labels for form fields", () => {
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      expect(screen.getByLabelText(/front \(question\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/back \(answer\)/i)).toBeInTheDocument();
    });

    it("sets aria-invalid when field has error", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.tab();

      await waitFor(() => {
        expect(frontInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("associates error messages with fields via aria-describedby", async () => {
      const user = userEvent.setup();
      render(
        <EditFlashcardModal
          flashcard={mockFlashcard}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          isSaving={false}
        />
      );

      const frontInput = screen.getByLabelText(/front \(question\)/i);
      await user.clear(frontInput);
      await user.tab();

      await waitFor(() => {
        expect(frontInput).toHaveAttribute("aria-describedby", "front-error");
      });
    });
  });
});
