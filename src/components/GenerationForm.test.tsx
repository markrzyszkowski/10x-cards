import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerationForm } from "./GenerationForm";

describe("GenerationForm", () => {
  const mockOnGenerate = vi.fn();
  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to efficiently set large text values
  const setTextareaValue = (textarea: HTMLElement, value: string) => {
    fireEvent.change(textarea, { target: { value } });
  };

  describe("form validation", () => {
    it("button is disabled when textarea is empty", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).toBeDisabled();
    });

    it("button is disabled when text is only whitespace", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      await user.type(textarea, "   \n\n   ");

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).toBeDisabled();
    });

    it("button is disabled when character count is below minimum (999 chars)", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(999));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).toBeDisabled();
    });

    it("button is enabled when character count is exactly at minimum (1000 chars)", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(1000));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).not.toBeDisabled();
    });

    it("button is enabled when character count is in valid range", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(5000));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).not.toBeDisabled();
    });

    it("button is enabled when character count is exactly at maximum (10000 chars)", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(10000));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).not.toBeDisabled();
    });

    it("button is disabled when character count exceeds maximum (10001 chars)", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(10001));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).toBeDisabled();
    });
  });

  describe("form submission", () => {
    it("calls onGenerate with trimmed source text when form is submitted", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const validText = "a".repeat(1000);
      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, validText);

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith(validText);
      expect(mockOnGenerate).toHaveBeenCalledTimes(1);
    });

    it("does not call onGenerate when text is empty", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it("does not call onGenerate when text is below minimum", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(999));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it("does not call onGenerate when text exceeds maximum", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, "a".repeat(10001));

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });
  });

  describe("isGenerating state", () => {
    it('shows "Generating..." button text when isGenerating is true', () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={true} />);

      expect(screen.getByRole("button", { name: /generating/i })).toHaveTextContent("Generating...");
    });

    it("disables button when isGenerating is true", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={true} />);

      const button = screen.getByRole("button", { name: /generating/i });
      expect(button).toBeDisabled();
    });

    it("disables textarea when isGenerating is true", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={true} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      expect(textarea).toBeDisabled();
    });
  });

  describe("disabled prop", () => {
    it("disables textarea when disabled prop is true", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} disabled={true} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      expect(textarea).toBeDisabled();
    });

    it("disables button when disabled prop is true", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} disabled={true} />);

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      expect(button).toBeDisabled();
    });
  });

  describe("character counter integration", () => {
    it("displays character count as user types", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      await user.type(textarea, "Hello");

      expect(screen.getByText(/5 \/ 10,000/)).toBeInTheDocument();
    });

    it("updates character count correctly", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      await user.type(textarea, "Test");

      expect(screen.getByText(/4 \/ 10,000/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper label for textarea", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      expect(screen.getByLabelText(/source text/i)).toBeInTheDocument();
    });

    it("associates character counter with textarea via aria-describedby", () => {
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      expect(textarea).toHaveAttribute("aria-describedby", "char-counter");
    });
  });

  describe("edge cases", () => {
    it("handles text with special characters", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const specialText = "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?".repeat(30); // ~1350 chars
      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, specialText);

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith(specialText);
    });

    it("handles multiline text", async () => {
      const user = userEvent.setup();
      render(<GenerationForm onGenerate={mockOnGenerate} isGenerating={false} />);

      const multilineText = "Line 1\nLine 2\nLine 3\n".repeat(100); // ~1900 chars
      const textarea = screen.getByPlaceholderText(/paste your educational text/i);
      setTextareaValue(textarea, multilineText);

      const button = screen.getByRole("button", { name: /generate flashcards/i });
      await user.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith(multilineText);
    });
  });
});
