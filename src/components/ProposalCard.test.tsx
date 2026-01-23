import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposalCard } from "./ProposalCard";
import type { ProposalWithStatus } from "./GenerateView.types";

describe("ProposalCard", () => {
  const mockOnAccept = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("display value calculation", () => {
    it("shows original front and back for pending proposals", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText("Original Question")).toBeInTheDocument();
      expect(screen.getByText("Original Answer")).toBeInTheDocument();
    });

    it("shows original front and back for accepted proposals", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "accepted",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText("Original Question")).toBeInTheDocument();
      expect(screen.getByText("Original Answer")).toBeInTheDocument();
    });

    it("shows edited front and back when status is edited and edited values exist", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "edited",
        editedFront: "Edited Question",
        editedBack: "Edited Answer",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText("Edited Question")).toBeInTheDocument();
      expect(screen.getByText("Edited Answer")).toBeInTheDocument();
      expect(screen.queryByText("Original Question")).not.toBeInTheDocument();
      expect(screen.queryByText("Original Answer")).not.toBeInTheDocument();
    });

    it("falls back to original when status is edited but editedFront is missing", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "edited",
        editedBack: "Edited Answer",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText("Original Question")).toBeInTheDocument();
    });

    it("falls back to original when status is edited but editedBack is missing", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "edited",
        editedFront: "Edited Question",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText("Original Answer")).toBeInTheDocument();
    });

    it("shows original front and back for rejected proposals", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "rejected",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText("Original Question")).toBeInTheDocument();
      expect(screen.getByText("Original Answer")).toBeInTheDocument();
    });
  });

  describe("edit mode toggle", () => {
    it("switches to edit mode when Edit button is clicked", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));

      // In edit mode, should show textareas instead of display text
      expect(screen.getByDisplayValue("Original Question")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Original Answer")).toBeInTheDocument();
    });

    it("pre-fills edit form with current display values", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "edited",
        editedFront: "Edited Question",
        editedBack: "Edited Answer",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));

      // Should pre-fill with edited values, not original
      expect(screen.getByDisplayValue("Edited Question")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Edited Answer")).toBeInTheDocument();
    });

    it("exits edit mode when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));
      expect(screen.getByDisplayValue("Original Question")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Should return to display mode
      expect(screen.queryByDisplayValue("Original Question")).not.toBeInTheDocument();
      expect(screen.getByText("Original Question")).toBeInTheDocument();
    });
  });

  describe("action callbacks", () => {
    it("calls onAccept with correct index when Accept is clicked", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Question", back: "Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={3} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /accept/i }));

      expect(mockOnAccept).toHaveBeenCalledWith(3);
      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });

    it("calls onReject with correct index when Reject is clicked", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Question", back: "Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={5} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /reject/i }));

      expect(mockOnReject).toHaveBeenCalledWith(5);
      expect(mockOnReject).toHaveBeenCalledTimes(1);
    });

    it("calls onEdit with correct index and edited values when Save is clicked", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={2} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));

      const frontTextarea = screen.getByDisplayValue("Original Question");
      const backTextarea = screen.getByDisplayValue("Original Answer");

      await user.clear(frontTextarea);
      await user.type(frontTextarea, "New Question");

      await user.clear(backTextarea);
      await user.type(backTextarea, "New Answer");

      await user.click(screen.getByRole("button", { name: /save/i }));

      expect(mockOnEdit).toHaveBeenCalledWith(2, "New Question", "New Answer");
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("exits edit mode after saving", async () => {
      const user = userEvent.setup();
      const proposal: ProposalWithStatus = {
        original: { front: "Original Question", back: "Original Answer" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      await user.click(screen.getByRole("button", { name: /edit/i }));
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Should return to display mode
      expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles proposal with empty strings", () => {
      const proposal: ProposalWithStatus = {
        original: { front: "", back: "" },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      // Should still render without errors
      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    });

    it("handles proposal with very long text", () => {
      const longFront = "a".repeat(1000);
      const longBack = "b".repeat(1000);
      const proposal: ProposalWithStatus = {
        original: { front: longFront, back: longBack },
        status: "pending",
      };

      render(
        <ProposalCard proposal={proposal} index={0} onAccept={mockOnAccept} onEdit={mockOnEdit} onReject={mockOnReject} />
      );

      expect(screen.getByText(longFront)).toBeInTheDocument();
      expect(screen.getByText(longBack)).toBeInTheDocument();
    });
  });
});
