import type { SupabaseClient } from "@/db/supabase.client.ts";
import type { CreateFlashcardDTO, FlashcardDTO } from "@/types.ts";
import type { TablesInsert } from "@/db/database.types.ts";

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
}

// Export singleton instance
export const flashcardService = new FlashcardService();
