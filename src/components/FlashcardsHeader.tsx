import { FilterControls } from "./FilterControls";

interface FlashcardsHeaderProps {
  source: "ai-full" | "ai-edited" | "manual" | undefined;
  sortField: "created_at" | "updated_at" | "front";
  sortOrder: "asc" | "desc";
  onSourceChange: (source: "ai-full" | "ai-edited" | "manual" | undefined) => void;
  onSortFieldChange: (field: "created_at" | "updated_at" | "front") => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
}

export function FlashcardsHeader({
  source,
  sortField,
  sortOrder,
  onSourceChange,
  onSortFieldChange,
  onSortOrderChange,
}: FlashcardsHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Flashcards</h1>
        <p className="text-lg text-muted-foreground">Manage and review your saved flashcards</p>
      </div>

      {/* Filter controls */}
      <FilterControls
        source={source}
        sortField={sortField}
        sortOrder={sortOrder}
        onSourceChange={onSourceChange}
        onSortFieldChange={onSortFieldChange}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
  );
}
