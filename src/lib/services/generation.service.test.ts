import { describe, it, expect, beforeEach, vi } from "vitest";
import { generationService } from "./generation.service";
import type { AIGenerationError } from "./generation.service";
import { OpenRouterError } from "./openrouter.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock the openRouterService module
vi.mock("./openrouter.service", () => ({
  openRouterService: {
    generateCompletion: vi.fn(),
  },
  OpenRouterError: class OpenRouterError extends Error {
    constructor(
      public code: string,
      message: string,
      public model: string,
      public statusCode?: number,
      public details?: unknown
    ) {
      super(message);
      this.name = "OpenRouterError";
    }
  },
}));

describe("GenerationService", () => {
  describe("calculateSourceTextHash", () => {
    it("should generate consistent hash for same input", () => {
      // Arrange
      const text = "This is a test text";

      // Act
      const hash1 = generationService.calculateSourceTextHash(text);
      const hash2 = generationService.calculateSourceTextHash(text);

      // Assert
      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
      expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it("should generate different hashes for different inputs", () => {
      // Arrange
      const text1 = "First text";
      const text2 = "Second text";

      // Act
      const hash1 = generationService.calculateSourceTextHash(text1);
      const hash2 = generationService.calculateSourceTextHash(text2);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    it("should generate known hash for known input", () => {
      // Arrange
      const text = "hello world";

      // Act
      const hash = generationService.calculateSourceTextHash(text);

      // Assert - SHA-256 of "hello world"
      expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
    });

    it("should handle empty string", () => {
      // Arrange
      const text = "";

      // Act
      const hash = generationService.calculateSourceTextHash(text);

      // Assert - SHA-256 of empty string
      expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
      expect(hash.length).toBe(64);
    });

    it("should handle Unicode characters", () => {
      // Arrange
      const text = "Hello 世界 🌍";

      // Act
      const hash1 = generationService.calculateSourceTextHash(text);
      const hash2 = generationService.calculateSourceTextHash(text);

      // Assert
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it("should handle special characters", () => {
      // Arrange
      const text = "Special: !@#$%^&*()_+-=[]{}|;':\",./<>?";

      // Act
      const hash = generationService.calculateSourceTextHash(text);

      // Assert
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });

    it("should handle multiline text", () => {
      // Arrange
      const text = `Line 1
Line 2
Line 3`;

      // Act
      const hash1 = generationService.calculateSourceTextHash(text);
      const hash2 = generationService.calculateSourceTextHash(text);

      // Assert
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it("should be case-sensitive", () => {
      // Arrange
      const text1 = "Hello World";
      const text2 = "hello world";

      // Act
      const hash1 = generationService.calculateSourceTextHash(text1);
      const hash2 = generationService.calculateSourceTextHash(text2);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    it("should detect whitespace differences", () => {
      // Arrange
      const text1 = "hello world";
      const text2 = "hello  world"; // Double space

      // Act
      const hash1 = generationService.calculateSourceTextHash(text1);
      const hash2 = generationService.calculateSourceTextHash(text2);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    it("should handle very long text", () => {
      // Arrange
      const text = "a".repeat(10000);

      // Act
      const hash = generationService.calculateSourceTextHash(text);

      // Assert
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
    });

    it("should produce hexadecimal output", () => {
      // Arrange
      const text = "test";

      // Act
      const hash = generationService.calculateSourceTextHash(text);

      // Assert - Check if all characters are valid hex (0-9, a-f)
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("logGenerationError", () => {
    let mockSupabase: SupabaseClient;
    let mockFrom: ReturnType<SupabaseClient["from"]>;
    let mockInsert: ReturnType<typeof mockFrom.insert>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Create mock chain for Supabase client
      mockInsert = {
        select: vi.fn().mockReturnThis(),
      } as any;

      mockFrom = {
        insert: vi.fn().mockReturnValue(mockInsert),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      } as any;

      mockSupabase = {
        from: vi.fn().mockReturnValue(mockFrom),
      } as any;

      // Spy on console.error
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should insert error log to database", async () => {
      // Arrange
      const userId = "user-123";
      const error: AIGenerationError = {
        code: "TEST_ERROR",
        message: "Test error message",
        model: "test-model",
      };
      const sourceTextHash = "abc123";
      const sourceTextLength = 500;

      mockFrom.insert = vi.fn().mockReturnValue({
        error: null,
      });

      // Act
      await generationService.logGenerationError(mockSupabase, userId, error, sourceTextHash, sourceTextLength);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      expect(mockFrom.insert).toHaveBeenCalledWith({
        user_id: userId,
        model: error.model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: error.code,
        error_message: error.message,
      });
    });

    it("should not throw on database error", async () => {
      // Arrange
      const userId = "user-123";
      const error: AIGenerationError = {
        code: "TEST_ERROR",
        message: "Test error message",
        model: "test-model",
      };

      mockFrom.insert = vi.fn().mockReturnValue({
        error: { message: "Database error" },
      });

      // Act & Assert - Should not throw
      await expect(
        generationService.logGenerationError(mockSupabase, userId, error, "hash", 100)
      ).resolves.not.toThrow();
    });

    it("should log to console on database error but not fail request", async () => {
      // Arrange
      const userId = "user-123";
      const error: AIGenerationError = {
        code: "TEST_ERROR",
        message: "Test error message",
        model: "test-model",
      };

      const dbError = { message: "Database error", code: "DB_ERROR" };
      mockFrom.insert = vi.fn().mockReturnValue({
        error: dbError,
      });

      // Act
      await generationService.logGenerationError(mockSupabase, userId, error, "hash", 100);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to log generation error to database:", dbError);
    });

    it("should handle exception during logging", async () => {
      // Arrange
      const userId = "user-123";
      const error: AIGenerationError = {
        code: "TEST_ERROR",
        message: "Test error message",
        model: "test-model",
      };

      mockSupabase.from = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Act & Assert - Should not throw
      await expect(
        generationService.logGenerationError(mockSupabase, userId, error, "hash", 100)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith("Exception while logging generation error:", expect.any(Error));
    });

    it("should handle all error properties correctly", async () => {
      // Arrange
      const userId = "user-456";
      const error: AIGenerationError = {
        code: "RATE_LIMIT_ERROR",
        message: "You have exceeded the rate limit",
        model: "gpt-4",
      };
      const sourceTextHash = "def456";
      const sourceTextLength = 1500;

      mockFrom.insert = vi.fn().mockReturnValue({
        error: null,
      });

      // Act
      await generationService.logGenerationError(mockSupabase, userId, error, sourceTextHash, sourceTextLength);

      // Assert
      expect(mockFrom.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          model: "gpt-4",
          source_text_hash: sourceTextHash,
          source_text_length: sourceTextLength,
          error_code: "RATE_LIMIT_ERROR",
          error_message: "You have exceeded the rate limit",
        })
      );
    });
  });

  describe("error transformation", () => {
    it("should transform OpenRouterError to AIGenerationError", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockRejectedValue(
        new OpenRouterError("RATE_LIMIT_ERROR", "Rate limit exceeded", "test-model", 429)
      );

      // Act & Assert
      await expect(generationService.generateFlashcards("some text")).rejects.toMatchObject({
        code: "RATE_LIMIT_ERROR",
        message: "Rate limit exceeded",
        model: "test-model",
      });
    });

    it("should transform generic Error to AIGenerationError", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockRejectedValue(new Error("Generic error"));

      // Act & Assert
      await expect(generationService.generateFlashcards("some text")).rejects.toMatchObject({
        code: "AI_GENERATION_FAILED",
        message: "Generic error",
        model: "unknown",
      });
    });

    it("should handle non-Error thrown values", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockRejectedValue("string error");

      // Act & Assert
      await expect(generationService.generateFlashcards("some text")).rejects.toMatchObject({
        code: "AI_GENERATION_FAILED",
        message: "Unknown error occurred",
        model: "unknown",
      });
    });
  });

  describe("generateFlashcards integration", () => {
    it("should return successful result with proposals", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      const mockResult = {
        model: "test-model",
        content: {
          proposals: [
            { front: "Question 1", back: "Answer 1" },
            { front: "Question 2", back: "Answer 2" },
          ],
        },
        duration: 1500,
      };

      vi.mocked(openRouterService.generateCompletion).mockResolvedValue(mockResult);

      // Act
      const result = await generationService.generateFlashcards("Test source text");

      // Assert
      expect(result).toEqual({
        model: "test-model",
        proposals: [
          { front: "Question 1", back: "Answer 1" },
          { front: "Question 2", back: "Answer 2" },
        ],
        generationDuration: 1500,
      });
    });

    it("should call openRouterService with correct schema", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockResolvedValue({
        model: "test-model",
        content: { proposals: [] },
        duration: 1000,
      });

      const sourceText = "Test text";

      // Act
      await generationService.generateFlashcards(sourceText);

      // Assert
      expect(openRouterService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining("expert educational content creator"),
        expect.stringContaining(sourceText),
        expect.objectContaining({
          name: "flashcard_proposals",
          schema: expect.objectContaining({
            type: "object",
            properties: expect.objectContaining({
              proposals: expect.any(Object),
            }),
          }),
        }),
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 2000,
        })
      );
    });
  });

  describe("business rules", () => {
    it("should use temperature of 0.7 for generation", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockResolvedValue({
        model: "test-model",
        content: { proposals: [] },
        duration: 1000,
      });

      // Act
      await generationService.generateFlashcards("Test");

      // Assert
      expect(openRouterService.generateCompletion).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          temperature: 0.7,
        })
      );
    });

    it("should use maxTokens of 2000 for generation", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockResolvedValue({
        model: "test-model",
        content: { proposals: [] },
        duration: 1000,
      });

      // Act
      await generationService.generateFlashcards("Test");

      // Assert
      expect(openRouterService.generateCompletion).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          maxTokens: 2000,
        })
      );
    });

    it("should include generation guidelines in system message", async () => {
      // Arrange
      const { openRouterService } = await import("./openrouter.service");

      vi.mocked(openRouterService.generateCompletion).mockResolvedValue({
        model: "test-model",
        content: { proposals: [] },
        duration: 1000,
      });

      // Act
      await generationService.generateFlashcards("Test");

      // Assert
      const systemMessage = vi.mocked(openRouterService.generateCompletion).mock.calls[0][0];
      expect(systemMessage).toContain("expert educational content creator");
      expect(systemMessage).toContain("3-10 flashcards");
      expect(systemMessage).toContain("single concept");
    });
  });
});
