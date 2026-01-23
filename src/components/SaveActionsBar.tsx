import { Button } from "@/components/ui/button";
import type { SaveActionsBarProps } from "./GenerateView.types";

export function SaveActionsBar({ acceptedCount, onSaveAll, isSaving }: SaveActionsBarProps) {
  const isDisabled = acceptedCount === 0 || isSaving;

  return (
    <div className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {acceptedCount === 0 ? (
            "No flashcards accepted yet"
          ) : (
            <>
              <span className="font-semibold text-foreground">{acceptedCount}</span> flashcard
              {acceptedCount === 1 ? "" : "s"} ready to save
            </>
          )}
        </p>
        <Button onClick={onSaveAll} disabled={isDisabled} data-test-id="proposals-save-all-button">
          {isSaving ? "Saving..." : "Save All Accepted"}
        </Button>
      </div>
    </div>
  );
}
