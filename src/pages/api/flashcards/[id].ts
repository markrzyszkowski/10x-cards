import type { APIContext } from "astro";
import { z } from "zod";
import type { FlashcardDTO } from "@/types.ts";
import { flashcardService } from "@/lib/services/flashcard.service.ts";

export const prerender = false;

// Validation schema for path parameter
const getFlashcardByIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * GET /api/flashcards/{id}
 * Retrieves a specific flashcard by ID for the authenticated user
 *
 * @param context - Astro API context with authentication and database access
 * @returns 200 with flashcard, 404 if not found/not owned, or error response
 */
export async function GET(context: APIContext) {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Valid authentication token required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Step 2: Validate path parameter
    let flashcardId: number;
    try {
      const params = getFlashcardByIdParamsSchema.parse({
        id: context.params.id,
      });
      flashcardId = params.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Invalid flashcard ID",
            message: "ID must be a positive integer",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID",
          message: "ID must be a positive integer",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Retrieve flashcard via service
    let flashcard: FlashcardDTO | null;
    try {
      flashcard = await flashcardService.getFlashcardById(userId, flashcardId, context.locals.supabase);
    } catch (error) {
      console.error("Error retrieving flashcard:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Return 404 if not found or not owned by user
    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return flashcard
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/flashcards/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
