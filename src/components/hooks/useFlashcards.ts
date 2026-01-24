import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { FlashcardsViewState, ApiErrorResponse } from "../FlashcardsView.types";
import type { FlashcardDTO, PaginatedFlashcardsResponseDTO, UpdateFlashcardDTO } from "../../types";

const DEFAULT_LIMIT = 50;

export function useFlashcards() {
  const [state, setState] = useState<FlashcardsViewState>({
    flashcards: [],
    pagination: null,
    filters: {
      source: undefined,
      sortField: "created_at",
      sortOrder: "desc",
    },
    offset: 0,
    isLoading: false,
    error: null,
    editingFlashcard: null,
    isEditModalOpen: false,
    deletingFlashcard: null,
    isDeleteDialogOpen: false,
    isSaving: false,
    isDeleting: false,
  });

  // Fetch flashcards function
  const fetchFlashcards = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryParams = new URLSearchParams({
        limit: DEFAULT_LIMIT.toString(),
        offset: state.offset.toString(),
        sort: state.filters.sortField,
        order: state.filters.sortOrder,
      });

      if (state.filters.source) {
        queryParams.append("source", state.filters.source);
      }

      const response = await fetch(`/api/flashcards?${queryParams}`);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          window.location.href = "/login";
          return;
        }

        const error: ApiErrorResponse = await response.json();
        throw new Error(error.message || "Failed to fetch flashcards");
      }

      const data: PaginatedFlashcardsResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: data.flashcards,
        pagination: data.pagination,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [state.filters, state.offset]);

  // Effect to fetch on mount and filter/sort changes
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards, state.filters, state.offset]);

  // Filter actions
  const setSourceFilter = useCallback((source: "ai-full" | "ai-edited" | "manual" | undefined) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, source },
      offset: 0, // Reset to first page when filter changes
    }));
  }, []);

  const setSortField = useCallback((sortField: "created_at" | "updated_at" | "front") => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, sortField },
      offset: 0, // Reset to first page when sort changes
    }));
  }, []);

  const setSortOrder = useCallback((sortOrder: "asc" | "desc") => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, sortOrder },
      offset: 0, // Reset to first page when sort changes
    }));
  }, []);

  // Pagination actions
  const goToNextPage = useCallback(() => {
    setState((prev) => {
      if (!prev.pagination || !prev.pagination.has_more) {
        return prev;
      }
      return {
        ...prev,
        offset: prev.offset + DEFAULT_LIMIT,
      };
    });
  }, []);

  const goToPreviousPage = useCallback(() => {
    setState((prev) => {
      if (prev.offset === 0) {
        return prev;
      }
      return {
        ...prev,
        offset: Math.max(0, prev.offset - DEFAULT_LIMIT),
      };
    });
  }, []);

  // Modal actions
  const openEditModal = useCallback((flashcard: FlashcardDTO) => {
    setState((prev) => ({
      ...prev,
      editingFlashcard: flashcard,
      isEditModalOpen: true,
    }));
  }, []);

  const closeEditModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editingFlashcard: null,
      isEditModalOpen: false,
      isSaving: false,
    }));
  }, []);

  const openDeleteDialog = useCallback((flashcard: FlashcardDTO) => {
    setState((prev) => ({
      ...prev,
      deletingFlashcard: flashcard,
      isDeleteDialogOpen: true,
    }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      deletingFlashcard: null,
      isDeleteDialogOpen: false,
      isDeleting: false,
    }));
  }, []);

  // Update flashcard
  const updateFlashcard = useCallback(async (id: number, updates: UpdateFlashcardDTO) => {
    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          // Flashcard no longer exists
          setState((prev) => ({
            ...prev,
            flashcards: prev.flashcards.filter((f) => f.id !== id),
            isEditModalOpen: false,
            editingFlashcard: null,
            isSaving: false,
          }));
          toast.error("This flashcard no longer exists");
          return;
        }

        const error: ApiErrorResponse = await response.json();
        throw new Error(error.message || "Failed to update flashcard");
      }

      const updatedFlashcard: FlashcardDTO = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.map((f) => (f.id === id ? updatedFlashcard : f)),
        isEditModalOpen: false,
        editingFlashcard: null,
        isSaving: false,
      }));

      toast.success("Flashcard updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update flashcard";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSaving: false,
      }));
      throw error; // Re-throw so modal can handle it
    }
  }, []);

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (id: number) => {
      setState((prev) => ({ ...prev, isDeleting: true }));

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error("Your session has expired. Please log in again.");
            window.location.href = "/login";
            return;
          }

          if (response.status === 404) {
            // Flashcard already deleted
            setState((prev) => ({
              ...prev,
              flashcards: prev.flashcards.filter((f) => f.id !== id),
              isDeleteDialogOpen: false,
              deletingFlashcard: null,
              isDeleting: false,
            }));
            toast.error("This flashcard no longer exists");
            return;
          }

          const error: ApiErrorResponse = await response.json();
          throw new Error(error.message || "Failed to delete flashcard");
        }

        await response.json();

        setState((prev) => {
          const newFlashcards = prev.flashcards.filter((f) => f.id !== id);

          // If page becomes empty and we're not on first page, go to previous page
          let newOffset = prev.offset;
          if (newFlashcards.length === 0 && prev.offset > 0) {
            newOffset = Math.max(0, prev.offset - DEFAULT_LIMIT);
          }

          return {
            ...prev,
            flashcards: newFlashcards,
            offset: newOffset,
            isDeleteDialogOpen: false,
            deletingFlashcard: null,
            isDeleting: false,
          };
        });

        toast.success("Flashcard deleted successfully");

        // If offset changed, trigger refetch
        setState((prev) => {
          if (prev.flashcards.length === 0 && prev.offset > 0) {
            fetchFlashcards();
          }
          return prev;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete flashcard";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isDeleting: false,
        }));
        throw error; // Re-throw so dialog can handle it
      }
    },
    [fetchFlashcards]
  );

  // Refetch flashcards (for manual refresh)
  const refetchFlashcards = useCallback(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    // State
    flashcards: state.flashcards,
    pagination: state.pagination,
    filters: state.filters,
    isLoading: state.isLoading,
    error: state.error,
    editingFlashcard: state.editingFlashcard,
    isEditModalOpen: state.isEditModalOpen,
    deletingFlashcard: state.deletingFlashcard,
    isDeleteDialogOpen: state.isDeleteDialogOpen,
    isSaving: state.isSaving,
    isDeleting: state.isDeleting,

    // Actions
    setSourceFilter,
    setSortField,
    setSortOrder,
    goToNextPage,
    goToPreviousPage,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    updateFlashcard,
    deleteFlashcard,
    refetchFlashcards,
  };
}
