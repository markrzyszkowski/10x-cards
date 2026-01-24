import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { FlashcardDTO } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Alert } from "./ui/alert";

interface DeleteConfirmationDialogProps {
  flashcard: FlashcardDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  flashcard,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!flashcard) return;

    setDeleteError(null);

    try {
      await onConfirm(flashcard.id);
      // Dialog will be closed by parent component on success
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete flashcard");
    }
  };

  if (!flashcard) return null;

  // Truncate front text if too long for preview
  const truncatedFront = flashcard.front.length > 100 ? flashcard.front.substring(0, 100) + "..." : flashcard.front;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete this flashcard? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Flashcard preview */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium">Question:</p>
          <p className="mt-1 text-sm text-muted-foreground">{truncatedFront}</p>
        </div>

        {/* Delete error */}
        {deleteError && (
          <Alert variant="destructive">
            <p className="text-sm">{deleteError}</p>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive hover:text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
