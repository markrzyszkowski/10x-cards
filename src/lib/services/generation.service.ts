import type { SupabaseClient } from "@/db/supabase.client.ts";
import type { FlashcardProposalDTO } from "@/types.ts";
import type { TablesInsert } from "@/db/database.types.ts";
import { createHash } from "crypto";
import { openRouterService, OpenRouterError } from "./openrouter.service.ts";

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
   * Uses OpenRouter.ai API for AI-powered flashcard generation
   *
   * @param sourceText - The text to generate flashcards from
   * @returns AI generation result with proposals and metadata
   * @throws AIGenerationError if generation fails
   */
  async generateFlashcards(sourceText: string): Promise<AIGenerationResult> {
    // Define the JSON schema for flashcard proposals
    const flashcardSchema = {
      name: "flashcard_proposals",
      description: "List of flashcard question-answer pairs generated from source text",
      schema: {
        type: "object",
        properties: {
          proposals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: {
                  type: "string",
                  description: "Question or prompt for the flashcard",
                },
                back: {
                  type: "string",
                  description: "Answer or explanation for the flashcard",
                },
              },
              required: ["front", "back"],
              additionalProperties: false,
            },
          },
        },
        required: ["proposals"],
        additionalProperties: false,
      },
    };

    // System message with flashcard generation instructions
    const systemMessage = `You are an expert educational content creator specializing in flashcard generation.

Your task is to generate high-quality, focused flashcards from the provided text.

Guidelines:
- Each flashcard should test a single concept clearly and concisely
- Questions should be specific and unambiguous
- Answers should be accurate and complete
- Use simple, direct language
- Generate between 3-10 flashcards depending on content richness
- Focus on the most important concepts and facts
- Avoid overly complex or trick questions
- Ensure questions can be answered based solely on the provided text`;

    // User message with source text
    const userMessage = `Generate flashcards from the following text:\n\n${sourceText}`;

    try {
      // Call OpenRouter service
      const result = await openRouterService.generateCompletion<{
        proposals: FlashcardProposalDTO[];
      }>(systemMessage, userMessage, flashcardSchema, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      return {
        model: result.model,
        proposals: result.content.proposals,
        generationDuration: result.duration,
      };
    } catch (error) {
      // Transform OpenRouterError to AIGenerationError
      if (error instanceof OpenRouterError) {
        throw {
          code: error.code,
          message: error.message,
          model: error.model,
        } as AIGenerationError;
      }

      // Handle unexpected errors
      throw {
        code: "AI_GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        model: "unknown",
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
