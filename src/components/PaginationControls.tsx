import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationDTO } from "../types";
import { Button } from "./ui/button";

interface PaginationControlsProps {
  pagination: PaginationDTO;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function PaginationControls({
  pagination,
  onPreviousPage,
  onNextPage,
}: PaginationControlsProps) {
  const { total, limit, offset, has_more } = pagination;

  const currentStart = offset + 1;
  const currentEnd = Math.min(offset + limit, total);

  const isFirstPage = offset === 0;
  const isLastPage = !has_more;

  const handlePreviousClick = () => {
    if (!isFirstPage) {
      onPreviousPage();
      // Scroll to top of list
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextClick = () => {
    if (!isLastPage) {
      onNextPage();
      // Scroll to top of list
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    action: () => void,
    disabled: boolean
  ) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className="flex items-center justify-between border-t pt-6">
      {/* Page info */}
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{currentStart}</span> to{" "}
        <span className="font-medium">{currentEnd}</span> of{" "}
        <span className="font-medium">{total}</span> flashcards
      </p>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousClick}
          onKeyDown={(e) => handleKeyDown(e, handlePreviousClick, isFirstPage)}
          disabled={isFirstPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextClick}
          onKeyDown={(e) => handleKeyDown(e, handleNextClick, isLastPage)}
          disabled={isLastPage}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
