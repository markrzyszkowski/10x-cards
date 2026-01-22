import type { APIContext } from "astro";
import { z } from "zod";
import type { FlashcardDTO, UpdateFlashcardDTO, DeleteResponseDTO } from "@/types.ts";
import { flashcardService } from "@/lib/services/flashcard.service.ts";

export const prerender = false;

// Validation schema for path parameter (shared across GET, PATCH, DELETE)
const flashcardIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Validation schema for PATCH request body
const updateFlashcardRequestSchema = z
  .object({
    front: z.string().max(200, "Front text must not exceed 200 characters").optional(),
    back: z.string().max(500, "Back text must not exceed 500 characters").optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
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
      const params = flashcardIdParamsSchema.parse({
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

/**
 * PATCH /api/flashcards/{id}
 * Updates a specific flashcard by ID for the authenticated user
 * Supports partial updates (front and/or back fields)
 * Automatically converts source from 'ai-full' to 'ai-edited' when flashcard is edited
 *
 * @param context - Astro API context with authentication and database access
 * @returns 200 with updated flashcard, 400 for validation errors, 404 if not found/not owned, or error response
 */
export async function PATCH(context: APIContext) {
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
      const params = flashcardIdParamsSchema.parse({
        id: context.params.id,
      });
      flashcardId = params.id;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
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
          error: "Validation failed",
          message: "ID must be a positive integer",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse and validate request body
    let requestBody: any;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let updates: UpdateFlashcardDTO;
    try {
      updates = updateFlashcardRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            message: firstError.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Update flashcard via service
    let updatedFlashcard: FlashcardDTO | null;
    try {
      updatedFlashcard = await flashcardService.updateFlashcard(userId, flashcardId, updates, context.locals.supabase);
    } catch (error) {
      console.error("Error updating flashcard:", error);
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

    // Step 5: Return 404 if not found or not owned by user
    if (!updatedFlashcard) {
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

    // Step 6: Return updated flashcard
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in PATCH /api/flashcards/[id]:", error);
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

/**
 * DELETE /api/flashcards/{id}
 * Permanently deletes a flashcard by ID for the authenticated user
 * Returns 404 for both non-existent flashcards and flashcards owned by other users
 *
 * @param context - Astro API context with authentication and database access
 * @returns 200 with success message, 400 for validation errors, 404 if not found/not owned, or error response
 */
export async function DELETE(context: APIContext) {
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
      const params = flashcardIdParamsSchema.parse({
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

    // Step 3: Delete flashcard via service
    let deleted: boolean;
    try {
      deleted = await flashcardService.deleteFlashcard(userId, flashcardId, context.locals.supabase);
    } catch (error) {
      console.error("Error deleting flashcard:", error);
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
    if (!deleted) {
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

    // Step 5: Return success message
    const response: DeleteResponseDTO = {
      message: "Flashcard successfully deleted",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in DELETE /api/flashcards/[id]:", error);
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
