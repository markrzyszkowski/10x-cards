import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFlashcardGeneration } from "./useFlashcardGeneration";
import type { CreateGenerationResponseDTO, CreateFlashcardsResponseDTO } from "@/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockGenerationResponse: CreateGenerationResponseDTO = {
  generation: {
    id: 1,
    user_id: "user-123",
    source_text: "Test source text",
    created_at: "2024-01-15T10:00:00Z",
  },
  proposals: [
    { front: "Question 1", back: "Answer 1" },
    { front: "Question 2", back: "Answer 2" },
    { front: "Question 3", back: "Answer 3" },
  ],
};

describe("useFlashcardGeneration", () => {
  let locationHref = "";

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    locationHref = "";

    // Mock window.location
    delete (window as any).location;
    window.location = {
      get href() {
        return locationHref;
      },
      set href(value: string) {
        locationHref = value;
      },
    } as Location;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts in idle state", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      expect(result.current.viewState).toEqual({ type: "idle" });
    });
  });

  describe("generateFlashcards", () => {
    it("transitions to generating state when called", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.generateFlashcards("Test source text");
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generating");
      });
    });

    it("successfully generates proposals and transitions to generated state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerationResponse,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.generateFlashcards("Test source text");
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      if (result.current.viewState.type === "generated") {
        expect(result.current.viewState.proposals).toHaveLength(3);
        expect(result.current.viewState.proposals[0]).toMatchObject({
          original: mockGenerationResponse.proposals[0],
          status: "pending",
        });
        expect(result.current.viewState.generationMetadata).toEqual(mockGenerationResponse.generation);
      }
    });

    it("handles 401 unauthorized by redirecting to login", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(locationHref).toBe("/login");
      });
    });

    it("handles 429 rate limit error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("error");
      });

      if (result.current.viewState.type === "error") {
        expect(result.current.viewState.error).toContain("too many requests");
      }
    });

    it("handles 400 validation error with custom message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Custom validation error" }),
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("error");
      });

      if (result.current.viewState.type === "error") {
        expect(result.current.viewState.error).toBe("Custom validation error");
      }
    });

    it("handles network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("error");
      });

      if (result.current.viewState.type === "error") {
        expect(result.current.viewState.error).toBe("Network failure");
      }
    });
  });

  describe("proposal management", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerationResponse,
      });
    });

    it("accepts a proposal", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerationResponse,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      result.current.acceptProposal(0);

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[0].status).toBe("accepted");
        }
      });
    });

    it("edits a proposal with new front and back text", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerationResponse,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      result.current.editProposal(1, "Edited Question", "Edited Answer");

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[1]).toMatchObject({
            status: "edited",
            editedFront: "Edited Question",
            editedBack: "Edited Answer",
          });
        }
      });
    });

    it("rejects a proposal", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerationResponse,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      result.current.rejectProposal(2);

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[2].status).toBe("rejected");
        }
      });
    });
  });

  describe("saveFlashcards", () => {
    const mockSaveResponse: CreateFlashcardsResponseDTO = {
      flashcards: [
        {
          id: 1,
          user_id: "user-123",
          front: "Question 1",
          back: "Answer 1",
          source: "ai-full",
          generation_id: 1,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          user_id: "user-123",
          front: "Edited Question",
          back: "Edited Answer",
          source: "ai-edited",
          generation_id: 1,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
    };

    it("saves only accepted and edited proposals", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse,
        });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      // Accept first, edit second, reject third
      result.current.acceptProposal(0);
      result.current.editProposal(1, "Edited Question", "Edited Answer");
      result.current.rejectProposal(2);

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[0].status).toBe("accepted");
        }
      });

      result.current.saveFlashcards();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/flashcards",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.any(String),
          })
        );
      });

      // Verify the request body contains only accepted/edited proposals
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);

      expect(requestBody.flashcards).toHaveLength(2);
      expect(requestBody.flashcards[0]).toMatchObject({
        front: "Question 1",
        back: "Answer 1",
        source: "ai-full",
      });
      expect(requestBody.flashcards[1]).toMatchObject({
        front: "Edited Question",
        back: "Edited Answer",
        source: "ai-edited",
      });
    });

    it("transitions to success state after successful save", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse,
        });

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.generateFlashcards("Test source text");
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      act(() => {
        result.current.acceptProposal(0);
      });

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[0].status).toBe("accepted");
        }
      });

      act(() => {
        result.current.saveFlashcards();
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("success");
      });

      if (result.current.viewState.type === "success") {
        expect(result.current.viewState.savedCount).toBe(2);
      }
    });

    it("determines source as ai-full for accepted proposals", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse,
        });

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.generateFlashcards("Test source text");
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      act(() => {
        result.current.acceptProposal(0);
      });

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[0].status).toBe("accepted");
        }
      });

      act(() => {
        result.current.saveFlashcards();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith("/api/flashcards", expect.any(Object));
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);

      expect(requestBody.flashcards[0].source).toBe("ai-full");
    });

    it("determines source as ai-edited for edited proposals", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSaveResponse,
        });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Test source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      result.current.editProposal(0, "Edited Front", "Edited Back");

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[0].status).toBe("edited");
        }
      });

      result.current.saveFlashcards();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith("/api/flashcards", expect.any(Object));
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);

      expect(requestBody.flashcards[0].source).toBe("ai-edited");
    });

    it("handles 401 during save by redirecting to login", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.generateFlashcards("Test source text");
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      act(() => {
        result.current.acceptProposal(0);
      });

      await waitFor(() => {
        if (result.current.viewState.type === "generated") {
          expect(result.current.viewState.proposals[0].status).toBe("accepted");
        }
      });

      act(() => {
        result.current.saveFlashcards();
      });

      await waitFor(() => {
        expect(locationHref).toBe("/login");
      });
    });
  });

  describe("retryGenerate", () => {
    it("retries with cached source text", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        });

      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.generateFlashcards("Original source text");

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("error");
      });

      result.current.retryGenerate();

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      // Verify it used the cached source text
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.source_text).toBe("Original source text");
    });

    it("resets to idle if no cached source text", async () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      result.current.retryGenerate();

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("idle");
      });
    });
  });

  describe("resetToIdle", () => {
    it("clears source text and resets to idle state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerationResponse,
      });

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.generateFlashcards("Test source text");
      });

      await waitFor(() => {
        expect(result.current.viewState.type).toBe("generated");
      });

      act(() => {
        result.current.resetToIdle();
      });

      expect(result.current.viewState).toEqual({ type: "idle" });

      // Verify source text is cleared by attempting retry
      act(() => {
        result.current.retryGenerate();
      });
      expect(result.current.viewState).toEqual({ type: "idle" });
    });
  });
});
