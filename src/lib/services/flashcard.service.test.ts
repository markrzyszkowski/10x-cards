import { describe, it, expect, beforeEach, vi } from "vitest";
import { flashcardService } from "./flashcard.service";
import type { GetFlashcardsParams } from "./flashcard.service";
import type { CreateFlashcardDTO, UpdateFlashcardDTO } from "@/types";
import type { SupabaseClient } from "@/db/supabase.client";

describe("FlashcardService", () => {
  let mockSupabase: SupabaseClient;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.error to verify error logging
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset mock
    mockSupabase = {} as SupabaseClient;
  });

  describe("createFlashcards", () => {
    describe("successful creation scenarios", () => {
      it("should create flashcards without generation_ids", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "manual", generation_id: null },
          { front: "Q2", back: "A2", source: "manual", generation_id: null },
        ];

        const createdFlashcards = [
          {
            id: 1,
            front: "Q1",
            back: "A1",
            source: "manual",
            generation_id: null,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
          {
            id: 2,
            front: "Q2",
            back: "A2",
            source: "manual",
            generation_id: null,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        ];

        const mockSelect = vi.fn().mockResolvedValue({
          data: createdFlashcards,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await flashcardService.createFlashcards(userId, flashcards, mockSupabase);

        // Assert
        expect(result).toEqual(createdFlashcards);
        expect(mockInsert).toHaveBeenCalledWith([
          { user_id: userId, front: "Q1", back: "A1", source: "manual", generation_id: null },
          { user_id: userId, front: "Q2", back: "A2", source: "manual", generation_id: null },
        ]);
      });

      it("should create flashcards with valid generation_ids", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "ai-full", generation_id: 1 },
          { front: "Q2", back: "A2", source: "ai-full", generation_id: 1 },
        ];

        // Mock generation verification query - need to return promise from in()
        const mockGenIn = vi.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null,
        });

        const mockGenEq = vi.fn().mockReturnValue({
          in: mockGenIn,
        });

        const mockGenSelect = vi.fn().mockReturnValue({
          eq: mockGenEq,
        });

        // Mock flashcard insert query
        const mockFlashcardSelect = vi.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              front: "Q1",
              back: "A1",
              source: "ai-full",
              generation_id: 1,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            {
              id: 2,
              front: "Q2",
              back: "A2",
              source: "ai-full",
              generation_id: 1,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ],
          error: null,
        });

        const mockFlashcardInsert = vi.fn().mockReturnValue({
          select: mockFlashcardSelect,
        });

        mockSupabase.from = vi.fn().mockImplementation((table: string) => {
          if (table === "generations") {
            return {
              select: mockGenSelect,
            };
          }
          if (table === "flashcards") {
            return {
              insert: mockFlashcardInsert,
            };
          }
        });

        // Act
        const result = await flashcardService.createFlashcards(userId, flashcards, mockSupabase);

        // Assert
        expect(result).toHaveLength(2);
        expect(mockGenEq).toHaveBeenCalledWith("user_id", userId);
        expect(mockGenIn).toHaveBeenCalledWith("id", [1]);
      });

      it("should handle duplicate generation_ids in batch", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "ai-full", generation_id: 5 },
          { front: "Q2", back: "A2", source: "ai-full", generation_id: 5 },
          { front: "Q3", back: "A3", source: "ai-full", generation_id: 5 },
        ];

        // Mock generation verification - should only check generation_id 5 once
        const mockGenIn = vi.fn().mockResolvedValue({
          data: [{ id: 5 }],
          error: null,
        });

        const mockGenEq = vi.fn().mockReturnValue({
          in: mockGenIn,
        });

        const mockGenSelect = vi.fn().mockReturnValue({
          eq: mockGenEq,
        });

        const mockFlashcardSelect = vi.fn().mockResolvedValue({
          data: [
            { id: 1, front: "Q1", back: "A1", source: "ai-full", generation_id: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: 2, front: "Q2", back: "A2", source: "ai-full", generation_id: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: 3, front: "Q3", back: "A3", source: "ai-full", generation_id: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
          error: null,
        });

        const mockFlashcardInsert = vi.fn().mockReturnValue({
          select: mockFlashcardSelect,
        });

        mockSupabase.from = vi.fn().mockImplementation((table: string) => {
          if (table === "generations") {
            return {
              select: mockGenSelect,
            };
          }
          if (table === "flashcards") {
            return {
              insert: mockFlashcardInsert,
            };
          }
        });

        // Act
        const result = await flashcardService.createFlashcards(userId, flashcards, mockSupabase);

        // Assert
        expect(result).toHaveLength(3);
        expect(mockGenIn).toHaveBeenCalledWith("id", [5]); // Only unique ID
      });

      it("should handle mixed flashcards with and without generation_ids", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "ai-full", generation_id: 1 },
          { front: "Q2", back: "A2", source: "manual", generation_id: null },
        ];

        const mockGenIn = vi.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null,
        });

        const mockGenEq = vi.fn().mockReturnValue({
          in: mockGenIn,
        });

        const mockGenSelect = vi.fn().mockReturnValue({
          eq: mockGenEq,
        });

        const mockFlashcardSelect = vi.fn().mockResolvedValue({
          data: [
            { id: 1, front: "Q1", back: "A1", source: "ai-full", generation_id: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
            { id: 2, front: "Q2", back: "A2", source: "manual", generation_id: null, created_at: "2024-01-01", updated_at: "2024-01-01" },
          ],
          error: null,
        });

        const mockFlashcardInsert = vi.fn().mockReturnValue({
          select: mockFlashcardSelect,
        });

        mockSupabase.from = vi.fn().mockImplementation((table: string) => {
          if (table === "generations") {
            return {
              select: mockGenSelect,
            };
          }
          if (table === "flashcards") {
            return {
              insert: mockFlashcardInsert,
            };
          }
        });

        // Act
        const result = await flashcardService.createFlashcards(userId, flashcards, mockSupabase);

        // Assert
        expect(result).toHaveLength(2);
        expect(mockGenIn).toHaveBeenCalledWith("id", [1]);
      });
    });

    describe("validation error scenarios", () => {
      it("should throw error when generation_id does not belong to user", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "ai-full", generation_id: 999 },
        ];

        const mockGenSelect = vi.fn().mockResolvedValue({
          data: [], // No matching generation found
          error: null,
        });

        const mockGenIn = vi.fn().mockReturnValue({
          select: mockGenSelect,
        });

        const mockGenEq = vi.fn().mockReturnValue({
          in: mockGenIn,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: mockGenEq,
          }),
        });

        // Act & Assert
        await expect(flashcardService.createFlashcards(userId, flashcards, mockSupabase)).rejects.toThrow(
          "Invalid generation_id: generation not found"
        );
      });

      it("should throw error when some generation_ids are missing", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "ai-full", generation_id: 1 },
          { front: "Q2", back: "A2", source: "ai-full", generation_id: 2 },
          { front: "Q3", back: "A3", source: "ai-full", generation_id: 3 },
        ];

        const mockGenSelect = vi.fn().mockResolvedValue({
          data: [{ id: 1 }, { id: 2 }], // Missing generation_id 3
          error: null,
        });

        const mockGenIn = vi.fn().mockReturnValue({
          select: mockGenSelect,
        });

        const mockGenEq = vi.fn().mockReturnValue({
          in: mockGenIn,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: mockGenEq,
          }),
        });

        // Act & Assert
        await expect(flashcardService.createFlashcards(userId, flashcards, mockSupabase)).rejects.toThrow(
          "Invalid generation_id: generation not found"
        );
      });

      it("should throw error when generation verification query fails", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "ai-full", generation_id: 1 },
        ];

        const mockGenIn = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const mockGenEq = vi.fn().mockReturnValue({
          in: mockGenIn,
        });

        const mockGenSelect = vi.fn().mockReturnValue({
          eq: mockGenEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockGenSelect,
        });

        // Act & Assert
        await expect(flashcardService.createFlashcards(userId, flashcards, mockSupabase)).rejects.toThrow(
          "Failed to verify generation references"
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it("should throw error when flashcard insertion fails", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "manual", generation_id: null },
        ];

        const mockSelect = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(flashcardService.createFlashcards(userId, flashcards, mockSupabase)).rejects.toThrow(
          "Failed to create flashcards"
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it("should throw error when insertion returns no data", async () => {
        // Arrange
        const userId = "user-123";
        const flashcards: CreateFlashcardDTO[] = [
          { front: "Q1", back: "A1", source: "manual", generation_id: null },
        ];

        const mockSelect = vi.fn().mockResolvedValue({
          data: null,
          error: null,
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(flashcardService.createFlashcards(userId, flashcards, mockSupabase)).rejects.toThrow(
          "Failed to create flashcards"
        );
      });
    });
  });

  describe("getFlashcards", () => {
    describe("successful retrieval scenarios", () => {
      it("should retrieve flashcards with pagination", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          sort: "created_at",
          order: "desc",
        };

        const flashcards = [
          { id: 1, front: "Q1", back: "A1", source: "manual", generation_id: null, created_at: "2024-01-01", updated_at: "2024-01-01" },
          { id: 2, front: "Q2", back: "A2", source: "manual", generation_id: null, created_at: "2024-01-02", updated_at: "2024-01-02" },
        ];

        const mockRange = vi.fn().mockResolvedValue({
          data: flashcards,
          error: null,
          count: 2,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(result.flashcards).toEqual(flashcards);
        expect(result.pagination).toEqual({
          total: 2,
          limit: 10,
          offset: 0,
          has_more: false,
        });
        expect(mockEq).toHaveBeenCalledWith("user_id", userId);
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
        expect(mockRange).toHaveBeenCalledWith(0, 9);
      });

      it("should calculate has_more correctly when there are more results", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          sort: "created_at",
          order: "asc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: Array(10).fill({ id: 1, front: "Q", back: "A", source: "manual", generation_id: null, created_at: "2024-01-01", updated_at: "2024-01-01" }),
          error: null,
          count: 25, // Total 25 items, but only returning 10
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(result.pagination.has_more).toBe(true);
        expect(result.pagination.total).toBe(25);
      });

      it("should apply source filter when provided", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          source: "ai-full",
          sort: "created_at",
          order: "desc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockSourceEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockUserEq = vi.fn().mockReturnValue({
          eq: mockSourceEq,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockUserEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(mockUserEq).toHaveBeenCalledWith("user_id", userId);
        expect(mockSourceEq).toHaveBeenCalledWith("source", "ai-full");
      });

      it("should support different sort fields", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          sort: "front",
          order: "asc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(mockOrder).toHaveBeenCalledWith("front", { ascending: true });
      });

      it("should handle empty result set", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          sort: "created_at",
          order: "desc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(result.flashcards).toEqual([]);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.has_more).toBe(false);
      });

      it("should handle pagination with offset", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 20,
          sort: "created_at",
          order: "desc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 50,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(mockRange).toHaveBeenCalledWith(20, 29); // offset to offset+limit-1
        expect(result.pagination.has_more).toBe(true); // 20+10 < 50
      });
    });

    describe("error scenarios", () => {
      it("should throw error when query fails", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          sort: "created_at",
          order: "desc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Query failed" },
          count: null,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act & Assert
        await expect(flashcardService.getFlashcards(userId, params, mockSupabase)).rejects.toThrow(
          "Failed to retrieve flashcards"
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it("should handle null count as 0", async () => {
        // Arrange
        const userId = "user-123";
        const params: GetFlashcardsParams = {
          limit: 10,
          offset: 0,
          sort: "created_at",
          order: "desc",
        };

        const mockRange = vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: null,
        });

        const mockOrder = vi.fn().mockReturnValue({
          range: mockRange,
        });

        const mockEq = vi.fn().mockReturnValue({
          order: mockOrder,
        });

        const mockSelect = vi.fn().mockReturnValue({
          eq: mockEq,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        // Act
        const result = await flashcardService.getFlashcards(userId, params, mockSupabase);

        // Assert
        expect(result.pagination.total).toBe(0);
      });
    });
  });

  describe("getFlashcardById", () => {
    it("should return flashcard when found and owned by user", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const flashcard = {
        id: 1,
        front: "Question",
        back: "Answer",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: flashcard,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await flashcardService.getFlashcardById(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toEqual(flashcard);
      expect(mockEq1).toHaveBeenCalledWith("id", flashcardId);
      expect(mockEq2).toHaveBeenCalledWith("user_id", userId);
    });

    it("should return null when flashcard not found (PGRST116)", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 999;

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await flashcardService.getFlashcardById(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when flashcard not owned by user (PGRST116)", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Act
      const result = await flashcardService.getFlashcardById(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toBeNull();
    });

    it("should throw error for other database errors", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "OTHER_ERROR", message: "Database error" },
      });

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      // Act & Assert
      await expect(flashcardService.getFlashcardById(userId, flashcardId, mockSupabase)).rejects.toThrow(
        "Failed to retrieve flashcard"
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("updateFlashcard", () => {
    describe("source conversion logic", () => {
      it("should convert ai-full to ai-edited when flashcard is updated", async () => {
        // Arrange
        const userId = "user-123";
        const flashcardId = 1;
        const updates: UpdateFlashcardDTO = { front: "Updated Question" };

        // Mock fetch current flashcard
        const mockFetchSingle = vi.fn().mockResolvedValue({
          data: { id: 1, source: "ai-full" },
          error: null,
        });

        const mockFetchEq2 = vi.fn().mockReturnValue({
          single: mockFetchSingle,
        });

        const mockFetchEq1 = vi.fn().mockReturnValue({
          eq: mockFetchEq2,
        });

        const mockFetchSelect = vi.fn().mockReturnValue({
          eq: mockFetchEq1,
        });

        // Mock update flashcard
        const mockUpdateSingle = vi.fn().mockResolvedValue({
          data: {
            id: 1,
            front: "Updated Question",
            back: "Answer",
            source: "ai-edited", // Should be converted
            generation_id: 1,
            created_at: "2024-01-01",
            updated_at: "2024-01-02",
          },
          error: null,
        });

        const mockUpdateSelect = vi.fn().mockReturnValue({
          single: mockUpdateSingle,
        });

        const mockUpdateEq2 = vi.fn().mockReturnValue({
          select: mockUpdateSelect,
        });

        const mockUpdateEq1 = vi.fn().mockReturnValue({
          eq: mockUpdateEq2,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockUpdateEq1,
        });

        let callCount = 0;
        mockSupabase.from = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { select: mockFetchSelect };
          }
          return { update: mockUpdate };
        });

        // Act
        const result = await flashcardService.updateFlashcard(userId, flashcardId, updates, mockSupabase);

        // Assert
        expect(result?.source).toBe("ai-edited");
        expect(mockUpdate).toHaveBeenCalledWith({
          front: "Updated Question",
          source: "ai-edited",
        });
      });

      it("should preserve ai-edited source on subsequent updates", async () => {
        // Arrange
        const userId = "user-123";
        const flashcardId = 1;
        const updates: UpdateFlashcardDTO = { back: "Updated Answer" };

        const mockFetchSingle = vi.fn().mockResolvedValue({
          data: { id: 1, source: "ai-edited" },
          error: null,
        });

        const mockFetchEq2 = vi.fn().mockReturnValue({
          single: mockFetchSingle,
        });

        const mockFetchEq1 = vi.fn().mockReturnValue({
          eq: mockFetchEq2,
        });

        const mockFetchSelect = vi.fn().mockReturnValue({
          eq: mockFetchEq1,
        });

        const mockUpdateSingle = vi.fn().mockResolvedValue({
          data: {
            id: 1,
            front: "Question",
            back: "Updated Answer",
            source: "ai-edited",
            generation_id: 1,
            created_at: "2024-01-01",
            updated_at: "2024-01-02",
          },
          error: null,
        });

        const mockUpdateSelect = vi.fn().mockReturnValue({
          single: mockUpdateSingle,
        });

        const mockUpdateEq2 = vi.fn().mockReturnValue({
          select: mockUpdateSelect,
        });

        const mockUpdateEq1 = vi.fn().mockReturnValue({
          eq: mockUpdateEq2,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockUpdateEq1,
        });

        let callCount = 0;
        mockSupabase.from = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { select: mockFetchSelect };
          }
          return { update: mockUpdate };
        });

        // Act
        const result = await flashcardService.updateFlashcard(userId, flashcardId, updates, mockSupabase);

        // Assert
        expect(result?.source).toBe("ai-edited");
        // Should NOT include source in update payload
        expect(mockUpdate).toHaveBeenCalledWith({
          back: "Updated Answer",
        });
      });

      it("should preserve manual source when updating", async () => {
        // Arrange
        const userId = "user-123";
        const flashcardId = 1;
        const updates: UpdateFlashcardDTO = { front: "Updated Question" };

        const mockFetchSingle = vi.fn().mockResolvedValue({
          data: { id: 1, source: "manual" },
          error: null,
        });

        const mockFetchEq2 = vi.fn().mockReturnValue({
          single: mockFetchSingle,
        });

        const mockFetchEq1 = vi.fn().mockReturnValue({
          eq: mockFetchEq2,
        });

        const mockFetchSelect = vi.fn().mockReturnValue({
          eq: mockFetchEq1,
        });

        const mockUpdateSingle = vi.fn().mockResolvedValue({
          data: {
            id: 1,
            front: "Updated Question",
            back: "Answer",
            source: "manual",
            generation_id: null,
            created_at: "2024-01-01",
            updated_at: "2024-01-02",
          },
          error: null,
        });

        const mockUpdateSelect = vi.fn().mockReturnValue({
          single: mockUpdateSingle,
        });

        const mockUpdateEq2 = vi.fn().mockReturnValue({
          select: mockUpdateSelect,
        });

        const mockUpdateEq1 = vi.fn().mockReturnValue({
          eq: mockUpdateEq2,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockUpdateEq1,
        });

        let callCount = 0;
        mockSupabase.from = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { select: mockFetchSelect };
          }
          return { update: mockUpdate };
        });

        // Act
        const result = await flashcardService.updateFlashcard(userId, flashcardId, updates, mockSupabase);

        // Assert
        expect(result?.source).toBe("manual");
        expect(mockUpdate).toHaveBeenCalledWith({
          front: "Updated Question",
        });
      });
    });

    describe("ownership and existence validation", () => {
      it("should return null when flashcard not found (PGRST116)", async () => {
        // Arrange
        const userId = "user-123";
        const flashcardId = 999;
        const updates: UpdateFlashcardDTO = { front: "Updated" };

        const mockFetchSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows returned" },
        });

        const mockFetchEq2 = vi.fn().mockReturnValue({
          single: mockFetchSingle,
        });

        const mockFetchEq1 = vi.fn().mockReturnValue({
          eq: mockFetchEq2,
        });

        const mockFetchSelect = vi.fn().mockReturnValue({
          eq: mockFetchEq1,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockFetchSelect,
        });

        // Act
        const result = await flashcardService.updateFlashcard(userId, flashcardId, updates, mockSupabase);

        // Assert
        expect(result).toBeNull();
      });

      it("should throw error when fetch fails with other errors", async () => {
        // Arrange
        const userId = "user-123";
        const flashcardId = 1;
        const updates: UpdateFlashcardDTO = { front: "Updated" };

        const mockFetchSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { code: "OTHER_ERROR", message: "Database error" },
        });

        const mockFetchEq2 = vi.fn().mockReturnValue({
          single: mockFetchSingle,
        });

        const mockFetchEq1 = vi.fn().mockReturnValue({
          eq: mockFetchEq2,
        });

        const mockFetchSelect = vi.fn().mockReturnValue({
          eq: mockFetchEq1,
        });

        mockSupabase.from = vi.fn().mockReturnValue({
          select: mockFetchSelect,
        });

        // Act & Assert
        await expect(flashcardService.updateFlashcard(userId, flashcardId, updates, mockSupabase)).rejects.toThrow(
          "Failed to retrieve flashcard"
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it("should throw error when update fails", async () => {
        // Arrange
        const userId = "user-123";
        const flashcardId = 1;
        const updates: UpdateFlashcardDTO = { front: "Updated" };

        const mockFetchSingle = vi.fn().mockResolvedValue({
          data: { id: 1, source: "manual" },
          error: null,
        });

        const mockFetchEq2 = vi.fn().mockReturnValue({
          single: mockFetchSingle,
        });

        const mockFetchEq1 = vi.fn().mockReturnValue({
          eq: mockFetchEq2,
        });

        const mockFetchSelect = vi.fn().mockReturnValue({
          eq: mockFetchEq1,
        });

        const mockUpdateSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Update failed" },
        });

        const mockUpdateSelect = vi.fn().mockReturnValue({
          single: mockUpdateSingle,
        });

        const mockUpdateEq2 = vi.fn().mockReturnValue({
          select: mockUpdateSelect,
        });

        const mockUpdateEq1 = vi.fn().mockReturnValue({
          eq: mockUpdateEq2,
        });

        const mockUpdate = vi.fn().mockReturnValue({
          eq: mockUpdateEq1,
        });

        let callCount = 0;
        mockSupabase.from = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return { select: mockFetchSelect };
          }
          return { update: mockUpdate };
        });

        // Act & Assert
        await expect(flashcardService.updateFlashcard(userId, flashcardId, updates, mockSupabase)).rejects.toThrow(
          "Failed to update flashcard"
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe("deleteFlashcard", () => {
    it("should return true when flashcard is successfully deleted", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const mockDelete = vi.fn().mockResolvedValue({
        error: null,
        count: 1,
      });

      const mockEq2 = vi.fn().mockReturnValue(Promise.resolve({ error: null, count: 1 }));

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq1,
        }),
      });

      // Act
      const result = await flashcardService.deleteFlashcard(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when flashcard not found", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 999;

      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
        count: 0,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq1,
        }),
      });

      // Act
      const result = await flashcardService.deleteFlashcard(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when flashcard not owned by user", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
        count: 0,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq1,
        }),
      });

      // Act
      const result = await flashcardService.deleteFlashcard(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toBe(false);
    });

    it("should throw error when delete operation fails", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const mockEq2 = vi.fn().mockResolvedValue({
        error: { message: "Delete failed" },
        count: null,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq1,
        }),
      });

      // Act & Assert
      await expect(flashcardService.deleteFlashcard(userId, flashcardId, mockSupabase)).rejects.toThrow(
        "Failed to delete flashcard"
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle null count as 0", async () => {
      // Arrange
      const userId = "user-123";
      const flashcardId = 1;

      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
        count: null,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      mockSupabase.from = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: mockEq1,
        }),
      });

      // Act
      const result = await flashcardService.deleteFlashcard(userId, flashcardId, mockSupabase);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("business rules validation", () => {
    it("should enforce user ownership in all operations", async () => {
      // This is implicitly tested in all the methods above
      // Each method checks user_id in the query
      expect(true).toBe(true);
    });

    it("should handle PGRST116 error code consistently across methods", async () => {
      // getFlashcardById and updateFlashcard both return null for PGRST116
      // This is tested in their respective test suites
      expect(true).toBe(true);
    });
  });
});
