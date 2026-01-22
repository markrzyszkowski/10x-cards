import type { SupabaseClient } from "@/db/supabase.client.ts";
import type { CreateFlashcardDTO, FlashcardDTO, PaginatedFlashcardsResponseDTO } from "@/types.ts";
import type { TablesInsert } from "@/db/database.types.ts";

/**
 * Query parameters for retrieving flashcards
 */
export interface GetFlashcardsParams {
  limit: number;
  offset: number;
  source?: "ai-full" | "ai-edited" | "manual";
  sort: "created_at" | "updated_at" | "front";
  order: "asc" | "desc";
}

/**
 * Service for managing flashcard operations
 */
class FlashcardService {
  /**
   * Creates multiple flashcards in a batch operation
   *
   * @param userId - The authenticated user's ID
   * @param flashcards - Array of flashcard data to create
   * @param supabase - Supabase client instance
   * @returns Array of created flashcards
   * @throws Error if validation or creation fails
   */
  async createFlashcards(
    userId: string,
    flashcards: CreateFlashcardDTO[],
    supabase: SupabaseClient
  ): Promise<FlashcardDTO[]> {
    // Extract unique generation_ids that are not null
    const generationIds = [
      ...new Set(flashcards.map((fc) => fc.generation_id).filter((id): id is number => id !== null)),
    ];

    // Verify all generation_ids belong to the user
    if (generationIds.length > 0) {
      const { data: generations, error: genError } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", userId)
        .in("id", generationIds);

      if (genError) {
        console.error("Failed to verify generation_ids:", genError);
        throw new Error("Failed to verify generation references");
      }

      // Check if all provided generation_ids exist and belong to user
      const foundIds = new Set(generations?.map((g) => g.id) || []);
      const missingIds = generationIds.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new Error("Invalid generation_id: generation not found");
      }
    }

    // Map flashcards to insert data with user_id
    const flashcardsToInsert: TablesInsert<"flashcards">[] = flashcards.map((fc) => ({
      user_id: userId,
      front: fc.front,
      back: fc.back,
      source: fc.source,
      generation_id: fc.generation_id,
    }));

    // Perform batch insert
    const { data: createdFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, front, back, source, generation_id, created_at, updated_at");

    if (insertError || !createdFlashcards) {
      console.error("Failed to insert flashcards:", insertError);
      throw new Error("Failed to create flashcards");
    }

    // Return created flashcards (user_id is excluded by select query)
    return createdFlashcards as FlashcardDTO[];
  }

  /**
   * Retrieves flashcards for a user with filtering, sorting, and pagination
   *
   * @param userId - The authenticated user's ID
   * @param params - Query parameters for filtering, sorting, and pagination
   * @param supabase - Supabase client instance
   * @returns Paginated response with flashcards and pagination metadata
   * @throws Error if database query fails
   */
  async getFlashcards(
    userId: string,
    params: GetFlashcardsParams,
    supabase: SupabaseClient
  ): Promise<PaginatedFlashcardsResponseDTO> {
    // Build base query with user filter (RLS will also enforce this)
    let query = supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
      .eq("user_id", userId);

    // Apply source filter if provided
    if (params.source) {
      query = query.eq("source", params.source);
    }

    // Apply sorting
    query = query.order(params.sort, { ascending: params.order === "asc" });

    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1);

    // Execute query
    const { data: flashcards, error, count } = await query;

    if (error) {
      console.error("Failed to retrieve flashcards:", error);
      throw new Error("Failed to retrieve flashcards");
    }

    // Calculate pagination metadata
    const total = count ?? 0;
    const hasMore = params.offset + params.limit < total;

    return {
      flashcards: (flashcards as FlashcardDTO[]) || [],
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        has_more: hasMore,
      },
    };
  }

  /**
   * Retrieves a single flashcard by ID for a specific user
   *
   * @param userId - The authenticated user's ID
   * @param flashcardId - The ID of the flashcard to retrieve
   * @param supabase - Supabase client instance
   * @returns Flashcard if found and owned by user, null otherwise
   * @throws Error if database query fails
   */
  async getFlashcardById(userId: string, flashcardId: number, supabase: SupabaseClient): Promise<FlashcardDTO | null> {
    // Query for the specific flashcard with user ownership validation
    // RLS will automatically filter by user_id, so we get null for both
    // "doesn't exist" and "not owned by user" cases
    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 is the "no rows returned" error code from PostgREST
      // This is expected when flashcard doesn't exist or isn't owned by user
      if (error.code === "PGRST116") {
        return null;
      }

      // Any other error is unexpected and should be thrown
      console.error("Failed to retrieve flashcard:", error);
      throw new Error("Failed to retrieve flashcard");
    }

    return flashcard as FlashcardDTO;
  }
}

// Export singleton instance
export const flashcardService = new FlashcardService();
