import { useState, useCallback } from "react";
import type { GenerationViewState, ProposalWithStatus } from "../GenerateView.types";
import type {
  CreateGenerationRequestDTO,
  CreateGenerationResponseDTO,
  CreateFlashcardsRequestDTO,
  CreateFlashcardsResponseDTO,
} from "@/types";

export function useFlashcardGeneration() {
  const [viewState, setViewState] = useState<GenerationViewState>({
    type: "idle",
  });
  const [lastSourceText, setLastSourceText] = useState<string>("");

  const generateFlashcards = useCallback(async (sourceText: string) => {
    setLastSourceText(sourceText);
    setViewState({ type: "generating" });

    try {
      const requestBody: CreateGenerationRequestDTO = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 429) {
          throw new Error("You've made too many requests. Please wait a few minutes and try again.");
        }

        if (response.status === 400) {
          const error = await response.json();
          throw new Error(error.message || "Invalid text length. Please use 1000-10000 characters.");
        }

        throw new Error("Failed to generate flashcards. Please try again.");
      }

      const data: CreateGenerationResponseDTO = await response.json();

      const proposals: ProposalWithStatus[] = data.proposals.map((proposal) => ({
        original: proposal,
        status: "pending" as const,
      }));

      setViewState({
        type: "generated",
        proposals,
        generationMetadata: data.generation,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setViewState({ type: "error", error: errorMessage });
    }
  }, []);

  const updateProposal = useCallback(
    (
      index: number,
      updates: {
        status?: ProposalWithStatus["status"];
        editedFront?: string;
        editedBack?: string;
      }
    ) => {
      setViewState((currentState) => {
        if (currentState.type !== "generated") {
          return currentState;
        }

        const newProposals = [...currentState.proposals];
        newProposals[index] = {
          ...newProposals[index],
          ...updates,
        };

        return {
          ...currentState,
          proposals: newProposals,
        };
      });
    },
    []
  );

  const acceptProposal = useCallback(
    (index: number) => {
      updateProposal(index, { status: "accepted" });
    },
    [updateProposal]
  );

  const editProposal = useCallback(
    (index: number, front: string, back: string) => {
      updateProposal(index, {
        status: "edited",
        editedFront: front,
        editedBack: back,
      });
    },
    [updateProposal]
  );

  const rejectProposal = useCallback(
    (index: number) => {
      updateProposal(index, { status: "rejected" });
    },
    [updateProposal]
  );

  const saveFlashcards = useCallback(async () => {
    if (viewState.type !== "generated") {
      return;
    }

    const acceptedProposals = viewState.proposals.filter((p) => p.status === "accepted" || p.status === "edited");

    if (acceptedProposals.length === 0) {
      setViewState({ type: "error", error: "No flashcards to save" });
      return;
    }

    setViewState({ type: "saving" });

    try {
      const requestBody: CreateFlashcardsRequestDTO = {
        flashcards: acceptedProposals.map((proposal) => ({
          front: proposal.status === "edited" && proposal.editedFront ? proposal.editedFront : proposal.original.front,
          back: proposal.status === "edited" && proposal.editedBack ? proposal.editedBack : proposal.original.back,
          source: proposal.status === "edited" ? "ai-edited" : "ai-full",
          generation_id: viewState.generationMetadata.id,
        })),
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 400) {
          const error = await response.json();
          throw new Error(error.message || "Validation failed. Please check your flashcards.");
        }

        throw new Error("Failed to save flashcards. Please try again.");
      }

      const data: CreateFlashcardsResponseDTO = await response.json();

      // Show success message and count of saved flashcards
      setViewState({
        type: "success",
        savedCount: data.flashcards.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      // Return to generated state with error message
      setViewState((currentState) => {
        if (currentState.type === "saving") {
          return { type: "error", error: errorMessage };
        }
        return currentState;
      });
    }
  }, [viewState]);

  const retryGenerate = useCallback(() => {
    if (lastSourceText) {
      // Retry with the same source text
      generateFlashcards(lastSourceText);
    } else {
      // No source text available, reset to idle
      setViewState({ type: "idle" });
    }
  }, [lastSourceText, generateFlashcards]);

  const resetToIdle = useCallback(() => {
    // Clear the last source text and reset to idle state
    setLastSourceText("");
    setViewState({ type: "idle" });
  }, []);

  return {
    viewState,
    generateFlashcards,
    acceptProposal,
    editProposal,
    rejectProposal,
    saveFlashcards,
    retryGenerate,
    resetToIdle,
  };
}
