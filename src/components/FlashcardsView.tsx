import { useFlashcards } from "./hooks/useFlashcards";
import { FlashcardsHeader } from "./FlashcardsHeader";
import { FlashcardsList } from "./FlashcardsList";
import { PaginationControls } from "./PaginationControls";
import { EmptyState } from "./EmptyState";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { Toaster } from "./ui/sonner";

export function FlashcardsView() {
  const {
    flashcards,
    pagination,
    filters,
    isLoading,
    error,
    editingFlashcard,
    isEditModalOpen,
    deletingFlashcard,
    isDeleteDialogOpen,
    isSaving,
    isDeleting,
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
  } = useFlashcards();

  const hasFilters = filters.source !== undefined;
  const hasNoFlashcards = flashcards.length === 0 && !isLoading;
  const showPagination = pagination && pagination.total > pagination.limit;

  return (
    <>
      <Toaster />
      {/* Screen reader live region for announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && "Loading flashcards..."}
        {!isLoading &&
          flashcards.length > 0 &&
          `${flashcards.length} flashcard${flashcards.length === 1 ? "" : "s"} displayed`}
        {error && `Error: ${error}`}
      </div>
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Header with filters */}
        <FlashcardsHeader
          source={filters.source}
          sortField={filters.sortField}
          sortOrder={filters.sortOrder}
          onSourceChange={setSourceFilter}
          onSortFieldChange={setSortField}
          onSortOrderChange={setSortOrder}
        />

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Error</h3>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
              <button onClick={refetchFlashcards} className="text-sm font-medium text-destructive hover:underline">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Flashcards list or empty state */}
        {hasNoFlashcards ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <FlashcardsList
              flashcards={flashcards}
              isLoading={isLoading}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
            />

            {/* Pagination controls */}
            {showPagination && (
              <PaginationControls pagination={pagination} onPreviousPage={goToPreviousPage} onNextPage={goToNextPage} />
            )}
          </>
        )}

        {/* Edit modal */}
        <EditFlashcardModal
          flashcard={editingFlashcard}
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={updateFlashcard}
          isSaving={isSaving}
        />

        {/* Delete confirmation dialog */}
        <DeleteConfirmationDialog
          flashcard={deletingFlashcard}
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={deleteFlashcard}
          isDeleting={isDeleting}
        />
      </div>
    </>
  );
}
