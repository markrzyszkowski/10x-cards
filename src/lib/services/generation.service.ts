import type { SupabaseClient } from "@/db/supabase.client.ts";
import type { FlashcardProposalDTO } from "@/types.ts";
import type { TablesInsert } from "@/db/database.types.ts";
import { createHash } from "crypto";

/**
 * Result returned from AI generation service
 */
export interface AIGenerationResult {
  model: string;
  proposals: FlashcardProposalDTO[];
  generationDuration: number;
}

/**
 * Error information from AI generation attempt
 */
export interface AIGenerationError {
  code: string;
  message: string;
  model: string;
}

/**
 * Service for generating flashcard proposals using AI
 */
class GenerationService {
  /**
   * Generates flashcard proposals from source text using AI
   * Currently uses a mock implementation that will be replaced with OpenRouter.ai
   *
   * @param sourceText - The text to generate flashcards from
   * @param userId - The authenticated user's ID
   * @returns AI generation result with proposals and metadata
   * @throws Error if generation fails
   */
  async generateFlashcards(sourceText: string, userId: string): Promise<AIGenerationResult> {
    const startTime = Date.now();

    try {
      // TODO: Replace with actual OpenRouter.ai API call
      // This is a mock implementation for initial testing
      const mockProposals: FlashcardProposalDTO[] = [
        {
          front: "What is the main concept discussed in the text?",
          back: "The main concept relates to the content provided in the source text.",
        },
        {
          front: "What are the key points mentioned?",
          back: "The key points are extracted from the source material.",
        },
        {
          front: "How does this topic relate to broader concepts?",
          back: "This topic connects to wider themes present in the material.",
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const endTime = Date.now();
      const generationDuration = endTime - startTime;

      return {
        model: "mock/gpt-4", // Will be replaced with actual model name
        proposals: mockProposals,
        generationDuration,
      };
    } catch (error) {
      const endTime = Date.now();
      throw {
        code: "AI_GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        model: "mock/gpt-4",
      } as AIGenerationError;
    }
  }

  /**
   * Calculates SHA-256 hash of source text
   * Used for deduplication and tracking without storing full text
   *
   * @param sourceText - The text to hash
   * @returns Hexadecimal hash string
   */
  calculateSourceTextHash(sourceText: string): string {
    return createHash("sha256").update(sourceText, "utf8").digest("hex");
  }

  /**
   * Logs a generation error to the database
   * Used for monitoring and debugging AI generation failures
   *
   * @param supabase - Supabase client instance
   * @param userId - The authenticated user's ID
   * @param error - Error information from the generation attempt
   * @param sourceTextHash - Hash of the source text
   * @param sourceTextLength - Character count of source text
   */
  async logGenerationError(
    supabase: SupabaseClient,
    userId: string,
    error: AIGenerationError,
    sourceTextHash: string,
    sourceTextLength: number
  ): Promise<void> {
    try {
      const errorLog: TablesInsert<"generation_error_logs"> = {
        user_id: userId,
        model: error.model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: error.code,
        error_message: error.message,
      };

      const { error: dbError } = await supabase.from("generation_error_logs").insert(errorLog);

      if (dbError) {
        // Log to console but don't throw - we don't want error logging to fail the request
        console.error("Failed to log generation error to database:", dbError);
      }
    } catch (err) {
      console.error("Exception while logging generation error:", err);
    }
  }
}

// Export singleton instance
export const generationService = new GenerationService();
