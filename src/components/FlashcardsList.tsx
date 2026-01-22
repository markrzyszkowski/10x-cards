import type { FlashcardDTO } from "../types";
import { FlashcardItem } from "./FlashcardItem";
import { Skeleton } from "./ui/skeleton";

interface FlashcardsListProps {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

export function FlashcardsList({
  flashcards,
  isLoading,
  onEdit,
  onDelete,
}: FlashcardsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-5 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((flashcard) => (
        <FlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
