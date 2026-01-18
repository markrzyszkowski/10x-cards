import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Flashcard DTO - represents a flashcard in API responses
 * Derived from database Row type, excluding user_id
 */
export type FlashcardDTO = Omit<Tables<"flashcards">, "user_id">;

/**
 * Create Flashcard DTO - request body for creating a single flashcard
 * Derived from database Insert type
 */
export type CreateFlashcardDTO = Pick<TablesInsert<"flashcards">, "front" | "back" | "source" | "generation_id">;

/**
 * Update Flashcard DTO - request body for updating a flashcard (partial update)
 * Only front and back fields are allowed to be updated
 */
export type UpdateFlashcardDTO = Pick<TablesUpdate<"flashcards">, "front" | "back">;

/**
 * Create Flashcards Request DTO - request body for POST /api/flashcards
 * Supports batch creation of multiple flashcards
 */
export interface CreateFlashcardsRequestDTO {
  flashcards: CreateFlashcardDTO[];
}

/**
 * Create Flashcards Response DTO - response body for POST /api/flashcards
 * Returns the created flashcards with generated IDs and timestamps
 */
export interface CreateFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
}

// ============================================================================
// Generation DTOs
// ============================================================================

/**
 * Generation DTO - represents a generation record in API responses
 * Derived from database Row type, excluding user_id
 */
export type GenerationDTO = Omit<Tables<"generations">, "user_id">;

/**
 * Create Generation Request DTO - request body for POST /api/generations
 * Contains source text for AI flashcard generation
 */
export interface CreateGenerationRequestDTO {
  source_text: string;
}

/**
 * Generation Metadata DTO - subset of generation data returned after creation
 * Contains only essential metadata about the generation process
 */
export type GenerationMetadataDTO = Pick<
  Tables<"generations">,
  "id" | "model" | "generated_count" | "generation_duration"
>;

/**
 * Flashcard Proposal DTO - represents an AI-generated flashcard proposal
 * These are not yet saved to the database and await user approval
 */
export interface FlashcardProposalDTO {
  front: string;
  back: string;
}

/**
 * Create Generation Response DTO - response body for POST /api/generations
 * Returns generation metadata and flashcard proposals for user review
 */
export interface CreateGenerationResponseDTO {
  generation: GenerationMetadataDTO;
  proposals: FlashcardProposalDTO[];
}

/**
 * Generation with Flashcards DTO - extended generation data including associated flashcards
 * Used in GET /api/generations/{id} endpoint
 */
export interface GenerationWithFlashcardsDTO extends GenerationDTO {
  flashcards: FlashcardDTO[];
}

// ============================================================================
// Generation Error Log DTOs
// ============================================================================

/**
 * Generation Error Log DTO - represents an error log entry in API responses
 * Derived from database Row type, excluding user_id
 */
export type GenerationErrorLogDTO = Omit<Tables<"generation_error_logs">, "user_id">;

// ============================================================================
// Pagination DTOs
// ============================================================================

/**
 * Pagination DTO - metadata for paginated responses
 * Provides information about the current page and whether more data is available
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Paginated Flashcards Response DTO - response for GET /api/flashcards
 */
export interface PaginatedFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO;
}

/**
 * Paginated Generations Response DTO - response for GET /api/generations
 */
export interface PaginatedGenerationsResponseDTO {
  generations: GenerationDTO[];
  pagination: PaginationDTO;
}

/**
 * Paginated Error Logs Response DTO - response for GET /api/generation-error-logs
 */
export interface PaginatedErrorLogsResponseDTO {
  error_logs: GenerationErrorLogDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Common Response DTOs
// ============================================================================

/**
 * Delete Response DTO - standard response for successful DELETE operations
 */
export interface DeleteResponseDTO {
  message: string;
}
