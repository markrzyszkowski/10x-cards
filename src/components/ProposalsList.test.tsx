import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProposalsList } from "./ProposalsList";
import type { ProposalWithStatus } from "./GenerateView.types";

const mockProposals: ProposalWithStatus[] = [
  {
    original: { front: "Question 1", back: "Answer 1" },
    status: "pending",
  },
  {
    original: { front: "Question 2", back: "Answer 2" },
    status: "accepted",
  },
  {
    original: { front: "Question 3", back: "Answer 3" },
    status: "edited",
    editedFront: "Edited Question 3",
    editedBack: "Edited Answer 3",
  },
  {
    original: { front: "Question 4", back: "Answer 4" },
    status: "rejected",
  },
];

describe("ProposalsList", () => {
  const mockOnAccept = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnReject = vi.fn();
  const mockOnSaveAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("accepted count calculation", () => {
    it("counts both accepted and edited proposals", () => {
      render(
        <ProposalsList
          proposals={mockProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      // Should count proposal at index 1 (accepted) and index 2 (edited) = 2 total
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText(/flashcards ready to save/)).toBeInTheDocument();
    });

    it("excludes pending proposals from count", () => {
      const pendingProposals: ProposalWithStatus[] = [
        { original: { front: "Q1", back: "A1" }, status: "pending" },
        { original: { front: "Q2", back: "A2" }, status: "pending" },
      ];

      render(
        <ProposalsList
          proposals={pendingProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("No flashcards accepted yet")).toBeInTheDocument();
    });

    it("excludes rejected proposals from count", () => {
      const rejectedProposals: ProposalWithStatus[] = [
        { original: { front: "Q1", back: "A1" }, status: "rejected" },
        { original: { front: "Q2", back: "A2" }, status: "rejected" },
      ];

      render(
        <ProposalsList
          proposals={rejectedProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("No flashcards accepted yet")).toBeInTheDocument();
    });

    it("counts only accepted proposals when no edited ones exist", () => {
      const acceptedOnly: ProposalWithStatus[] = [
        { original: { front: "Q1", back: "A1" }, status: "accepted" },
        { original: { front: "Q2", back: "A2" }, status: "accepted" },
        { original: { front: "Q3", back: "A3" }, status: "pending" },
      ];

      render(
        <ProposalsList
          proposals={acceptedOnly}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText(/flashcards ready to save/)).toBeInTheDocument();
    });

    it("counts only edited proposals when no accepted ones exist", () => {
      const editedOnly: ProposalWithStatus[] = [
        {
          original: { front: "Q1", back: "A1" },
          status: "edited",
          editedFront: "Edited Q1",
          editedBack: "Edited A1",
        },
        { original: { front: "Q2", back: "A2" }, status: "pending" },
      ];

      render(
        <ProposalsList
          proposals={editedOnly}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/flashcard ready to save/)).toBeInTheDocument();
    });
  });

  describe("proposal count display", () => {
    it("displays total proposal count correctly", () => {
      render(
        <ProposalsList
          proposals={mockProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("4 proposals")).toBeInTheDocument();
    });

    it('uses singular "proposal" for single item', () => {
      const singleProposal: ProposalWithStatus[] = [
        { original: { front: "Q1", back: "A1" }, status: "pending" },
      ];

      render(
        <ProposalsList
          proposals={singleProposal}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("1 proposal")).toBeInTheDocument();
    });
  });

  describe("proposals rendering", () => {
    it("renders all proposals as ProposalCard components", () => {
      render(
        <ProposalsList
          proposals={mockProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByText("Question 2")).toBeInTheDocument();
      expect(screen.getByText("Edited Question 3")).toBeInTheDocument();
      expect(screen.getByText("Question 4")).toBeInTheDocument();
    });
  });

  describe("SaveActionsBar integration", () => {
    it("passes correct accepted count to SaveActionsBar", () => {
      render(
        <ProposalsList
          proposals={mockProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      // Accepted count is 2 (1 accepted + 1 edited)
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText(/flashcards ready to save/)).toBeInTheDocument();
    });

    it("passes isSaving prop to SaveActionsBar", () => {
      const { rerender } = render(
        <ProposalsList
          proposals={mockProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={false}
        />
      );

      const saveButton = screen.getByRole("button", { name: /save all accepted/i });
      expect(saveButton).not.toBeDisabled();

      rerender(
        <ProposalsList
          proposals={mockProposals}
          generationId="gen-123"
          onAccept={mockOnAccept}
          onEdit={mockOnEdit}
          onReject={mockOnReject}
          onSaveAll={mockOnSaveAll}
          isSaving={true}
        />
      );

      expect(saveButton).toBeDisabled();
    });
  });
});
