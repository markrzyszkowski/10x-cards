import { useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { FlashcardDTO } from "../types";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface FlashcardItemProps {
  flashcard: FlashcardDTO;
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

export function FlashcardItem({ flashcard, onEdit, onDelete }: FlashcardItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpanded();
    }
  };

  const getSourceBadge = () => {
    switch (flashcard.source) {
      case "ai-full":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            AI Generated
          </Badge>
        );
      case "ai-edited":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
            AI Edited
          </Badge>
        );
      case "manual":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Manual
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div
              role="button"
              tabIndex={0}
              onClick={toggleExpanded}
              onKeyDown={handleKeyDown}
              className="cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-expanded={isExpanded}
            >
              <div className="flex items-start gap-2">
                <p className="font-semibold leading-tight flex-1">{flashcard.front}</p>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="border-t pt-6">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{flashcard.back}</p>
        </CardContent>
      )}

      <CardFooter className="mt-auto flex-col items-start gap-3 border-t">
        {/* Metadata row */}
        <div className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">{getSourceBadge()}</div>
          <div className="text-right">
            <div>Created: {formatDate(flashcard.created_at)}</div>
            {flashcard.updated_at !== flashcard.created_at && <div>Updated: {formatDate(flashcard.updated_at)}</div>}
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(flashcard)} aria-label="Edit flashcard">
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(flashcard)}
            aria-label="Delete flashcard"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
