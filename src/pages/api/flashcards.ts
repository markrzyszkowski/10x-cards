import type { APIContext } from "astro";
import { z } from "zod";
import type {
  CreateFlashcardsRequestDTO,
  CreateFlashcardsResponseDTO,
  PaginatedFlashcardsResponseDTO,
} from "@/types.ts";
import { flashcardService } from "@/lib/services/flashcard.service.ts";

export const prerender = false;

// Validation schema for GET query parameters
const getFlashcardsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  sort: z.enum(["created_at", "updated_at", "front"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Validation schema for individual flashcard
const createFlashcardSchema = z
  .object({
    front: z.string().max(200, "Front text must not exceed 200 characters"),
    back: z.string().max(500, "Back text must not exceed 500 characters"),
    source: z.enum(["ai-full", "ai-edited", "manual"], {
      errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" }),
    }),
    generation_id: z.number().nullable(),
  })
  .refine(
    (data) => {
      if (data.source === "manual") {
        return data.generation_id === null;
      }
      return data.generation_id !== null;
    },
    {
      message: "generation_id must be null for manual source and required for AI sources",
    }
  );

// Validation schema for request body
const createFlashcardsRequestSchema = z.object({
  flashcards: z.array(createFlashcardSchema).min(1, "At least one flashcard is required"),
});

/**
 * POST /api/flashcards
 * Creates one or more flashcards for the authenticated user
 *
 * @param context - Astro API context with authentication and database access
 * @returns 201 with created flashcards, or error response
 */
export async function POST(context: APIContext) {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Step 2: Parse and validate request body
    let requestBody: CreateFlashcardsRequestDTO;
    try {
      const rawBody = await context.request.json();
      requestBody = createFlashcardsRequestSchema.parse(rawBody);
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

    // Step 3: Create flashcards via service
    let createdFlashcards;
    try {
      createdFlashcards = await flashcardService.createFlashcards(
        userId,
        requestBody.flashcards,
        context.locals.supabase
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      // Check if it's a validation error (generation_id not found)
      if (errorMessage.includes("generation not found")) {
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // All other errors are server errors
      console.error("Error creating flashcards:", error);
      return new Response(JSON.stringify({ error: "Failed to create flashcards. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Format and return response
    const response: CreateFlashcardsResponseDTO = {
      flashcards: createdFlashcards,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/flashcards:", error);
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

/**
 * GET /api/flashcards
 * Retrieves paginated, filtered, and sorted flashcards for the authenticated user
 *
 * @param context - Astro API context with authentication and database access
 * @returns 200 with paginated flashcards, or error response
 */
export async function GET(context: APIContext) {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Valid authentication token required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Step 2: Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      source: url.searchParams.get("source"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
    };

    let validatedParams;
    try {
      validatedParams = getFlashcardsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const field = firstError?.path.join(".") || "parameter";
        const message = firstError?.message || "Invalid query parameter";
        return new Response(
          JSON.stringify({
            error: "Invalid query parameters",
            message: `${field}: ${message}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Retrieve flashcards via service
    let result: PaginatedFlashcardsResponseDTO;
    try {
      result = await flashcardService.getFlashcards(userId, validatedParams, context.locals.supabase);
    } catch (error) {
      console.error("Error retrieving flashcards:", error);
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

    // Step 4: Return paginated response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/flashcards:", error);
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
