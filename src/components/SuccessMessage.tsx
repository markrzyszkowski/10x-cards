import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SuccessMessageProps {
  savedCount: number;
  onStartOver: () => void;
}

export function SuccessMessage({ savedCount, onStartOver }: SuccessMessageProps) {
  return (
    <Alert className="border-green-600 bg-green-50 dark:bg-green-950" data-test-id="generate-success-message">
      <AlertTitle className="text-green-900 dark:text-green-100">Success!</AlertTitle>
      <AlertDescription className="mt-2 space-y-3 text-green-800 dark:text-green-200">
        <p>
          Successfully saved <span className="font-semibold">{savedCount}</span> flashcard{savedCount === 1 ? "" : "s"}{" "}
          to your collection.
        </p>
        <Button onClick={onStartOver} variant="outline" size="sm" data-test-id="generate-start-over-button">
          Generate More Flashcards
        </Button>
      </AlertDescription>
    </Alert>
  );
}
