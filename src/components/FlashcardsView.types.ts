import type { FlashcardDTO, PaginationDTO } from "../types";

// ============================================================================
// ViewModels for Flashcards View
// ============================================================================

/**
 * View state for the main FlashcardsView component
 * Manages all data, filters, UI state, and modal states
 */
export interface FlashcardsViewState {
  // Data
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO | null;

  // Filters and sorting
  filters: {
    source: "ai-full" | "ai-edited" | "manual" | undefined;
    sortField: "created_at" | "updated_at" | "front";
    sortOrder: "asc" | "desc";
  };

  // Current page offset
  offset: number;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Modal states
  editingFlashcard: FlashcardDTO | null;
  isEditModalOpen: boolean;
  deletingFlashcard: FlashcardDTO | null;
  isDeleteDialogOpen: boolean;

  // Action states
  isSaving: boolean;
  isDeleting: boolean;
}

/**
 * Form state for edit modal
 * Tracks form inputs, validation errors, and dirty state
 */
export interface EditFlashcardFormState {
  front: string;
  back: string;
  errors: {
    front?: string;
    back?: string;
  };
  isDirty: boolean;
}

/**
 * Source filter options for dropdown
 * Maps internal values to user-friendly labels
 */
export interface SourceFilterOption {
  value: "ai-full" | "ai-edited" | "manual" | "all";
  label: string;
}

/**
 * Sort field options for dropdown
 * Maps database fields to user-friendly labels
 */
export interface SortFieldOption {
  value: "created_at" | "updated_at" | "front";
  label: string;
}

/**
 * API error response structure
 * Standard error format returned by backend
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
}
