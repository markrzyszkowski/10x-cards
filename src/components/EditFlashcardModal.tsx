import { useState, useEffect } from "react";
import type { FlashcardDTO, UpdateFlashcardDTO } from "../types";
import type { EditFlashcardFormState } from "./FlashcardsView.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Alert } from "./ui/alert";

interface EditFlashcardModalProps {
  flashcard: FlashcardDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, updates: UpdateFlashcardDTO) => Promise<void>;
  isSaving: boolean;
}

export function EditFlashcardModal({
  flashcard,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: EditFlashcardModalProps) {
  const [formState, setFormState] = useState<EditFlashcardFormState>({
    front: "",
    back: "",
    errors: {},
    isDirty: false,
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFormState({
        front: flashcard.front,
        back: flashcard.back,
        errors: {},
        isDirty: false,
      });
      setSaveError(null);
    }
  }, [flashcard]);

  const validateField = (field: "front" | "back", value: string): string | undefined => {
    const trimmed = value.trim();
    const maxLength = field === "front" ? 200 : 500;

    if (trimmed === "") {
      return `${field === "front" ? "Front" : "Back"} text is required`;
    }

    if (value.length > maxLength) {
      return `${field === "front" ? "Front" : "Back"} text must not exceed ${maxLength} characters`;
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const frontError = validateField("front", formState.front);
    const backError = validateField("back", formState.back);

    const errors: EditFlashcardFormState["errors"] = {};
    if (frontError) errors.front = frontError;
    if (backError) errors.back = backError;

    setFormState((prev) => ({ ...prev, errors }));

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: "front" | "back", value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      isDirty: true,
      errors: {
        ...prev.errors,
        [field]: undefined, // Clear error when user types
      },
    }));
  };

  const handleBlur = (field: "front" | "back") => {
    if (formState.isDirty) {
      const error = validateField(field, formState[field]);
      if (error) {
        setFormState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [field]: error },
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!flashcard) return;
    if (!validateForm()) return;

    // Check if at least one field changed
    if (formState.front === flashcard.front && formState.back === flashcard.back) {
      setFormState((prev) => ({
        ...prev,
        errors: { front: "Please make at least one change" },
      }));
      return;
    }

    try {
      const updates: UpdateFlashcardDTO = {};
      if (formState.front !== flashcard.front) {
        updates.front = formState.front;
      }
      if (formState.back !== flashcard.back) {
        updates.back = formState.back;
      }

      await onSave(flashcard.id, updates);
      // Modal will be closed by parent component
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save changes");
    }
  };

  const handleCancel = () => {
    if (formState.isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );
      if (!confirmed) return;
    }
    onClose();
  };

  const getCharacterCountColor = (length: number, maxLength: number): string => {
    const threshold90 = maxLength * 0.9;
    if (length > maxLength) return "text-destructive";
    if (length >= threshold90) return "text-yellow-600 dark:text-yellow-500";
    return "text-muted-foreground";
  };

  if (!flashcard) return null;

  const frontCharCount = formState.front.length;
  const backCharCount = formState.back.length;
  const hasErrors = Object.values(formState.errors).some((error) => error !== undefined);
  const isSaveDisabled = !formState.isDirty || hasErrors || isSaving;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>
            Make changes to your flashcard. Both fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Front text field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="front-text" className="text-sm font-medium">
                  Front (Question)
                </label>
                <span className={`text-xs ${getCharacterCountColor(frontCharCount, 200)}`}>
                  {frontCharCount}/200
                </span>
              </div>
              <Textarea
                id="front-text"
                value={formState.front}
                onChange={(e) => handleInputChange("front", e.target.value)}
                onBlur={() => handleBlur("front")}
                placeholder="Enter the question or prompt..."
                className="min-h-[100px]"
                aria-invalid={!!formState.errors.front}
                aria-describedby={formState.errors.front ? "front-error" : undefined}
              />
              {formState.errors.front && (
                <p id="front-error" className="text-sm text-destructive">
                  {formState.errors.front}
                </p>
              )}
            </div>

            {/* Back text field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="back-text" className="text-sm font-medium">
                  Back (Answer)
                </label>
                <span className={`text-xs ${getCharacterCountColor(backCharCount, 500)}`}>
                  {backCharCount}/500
                </span>
              </div>
              <Textarea
                id="back-text"
                value={formState.back}
                onChange={(e) => handleInputChange("back", e.target.value)}
                onBlur={() => handleBlur("back")}
                placeholder="Enter the answer or explanation..."
                className="min-h-[150px]"
                aria-invalid={!!formState.errors.back}
                aria-describedby={formState.errors.back ? "back-error" : undefined}
              />
              {formState.errors.back && (
                <p id="back-error" className="text-sm text-destructive">
                  {formState.errors.back}
                </p>
              )}
            </div>

            {/* Save error */}
            {saveError && (
              <Alert variant="destructive">
                <p className="text-sm">{saveError}</p>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaveDisabled}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
