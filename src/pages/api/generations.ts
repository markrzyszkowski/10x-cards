import type { APIContext } from "astro";
import { z } from "zod";
import type { CreateGenerationRequestDTO, CreateGenerationResponseDTO, GenerationMetadataDTO } from "@/types.ts";
import type { TablesInsert } from "@/db/database.types.ts";
import { rateLimitService } from "@/lib/services/rate-limit.service.ts";
import { generationService, type AIGenerationError } from "@/lib/services/generation.service.ts";

export const prerender = false;

// Validation schema for request body
const createGenerationRequestSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters"),
});

/**
 * POST /api/generations
 * Generates AI-powered flashcard proposals from source text
 *
 * @param context - Astro API context with authentication and database access
 * @returns 201 with generation metadata and flashcard proposals, or error response
 */
export async function POST(context: APIContext) {
  try {
    // TODO: Implement authentication
    // const {
    //   data: { user },
    //   error: authError,
    // } = await context.locals.supabase.auth.getUser();
    //
    // if (authError || !user) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
    //
    // const userId = user.id;

    // Temporary hardcoded user ID for testing
    const userId = "bdc3271c-9353-43a1-9566-5add1f7ed69e";

    // Step 2: Parse and validate request body
    let requestBody: CreateGenerationRequestDTO;
    try {
      const rawBody = await context.request.json();
      requestBody = createGenerationRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || "Invalid request body";
        return new Response(JSON.stringify({ error: message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Invalid request body format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Check rate limit
    const isAllowed = rateLimitService.checkRateLimit(userId);
    if (!isAllowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Calculate source text metadata
    const sourceText = requestBody.source_text;
    const sourceTextHash = generationService.calculateSourceTextHash(sourceText);
    const sourceTextLength = sourceText.length;

    // Step 5: Generate flashcard proposals using AI
    let aiResult;
    try {
      aiResult = await generationService.generateFlashcards(sourceText, userId);
    } catch (error) {
      // Log error to database
      const aiError = error as AIGenerationError;
      await generationService.logGenerationError(
        context.locals.supabase,
        userId,
        aiError,
        sourceTextHash,
        sourceTextLength
      );

      return new Response(
        JSON.stringify({
          error: "Failed to generate flashcards. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Insert generation record into database
    const generationRecord: TablesInsert<"generations"> = {
      user_id: userId,
      model: aiResult.model,
      generated_count: aiResult.proposals.length,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generation_duration: aiResult.generationDuration,
      accepted_unedited_count: null,
      accepted_edited_count: null,
    };

    const { data: insertedGeneration, error: dbError } = await context.locals.supabase
      .from("generations")
      .insert(generationRecord)
      .select("id, model, generated_count, generation_duration")
      .single();

    if (dbError || !insertedGeneration) {
      console.error("Failed to insert generation record:", dbError);
      return new Response(
        JSON.stringify({
          error: "Failed to save generation. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 7: Format and return response
    const response: CreateGenerationResponseDTO = {
      generation: {
        id: insertedGeneration.id,
        model: insertedGeneration.model,
        generated_count: insertedGeneration.generated_count,
        generation_duration: insertedGeneration.generation_duration,
      } as GenerationMetadataDTO,
      proposals: aiResult.proposals,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/generations:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
