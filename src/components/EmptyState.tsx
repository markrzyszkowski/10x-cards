import { FileQuestion, Filter } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Filter className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No flashcards found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No flashcards match the selected filters. Try adjusting your filter criteria.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No flashcards yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        You haven't created any flashcards yet. Generate your first set of flashcards from text.
      </p>
      <Button variant="default" className="mt-6" onClick={() => (window.location.href = "/generate")}>
        Generate your first flashcards
      </Button>
    </div>
  );
}
