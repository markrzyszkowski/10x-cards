import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CharacterCounter } from "./CharacterCounter";
import type { ProposalEditProps } from "./GenerateView.types";

const MAX_FRONT_CHARS = 200;
const MAX_BACK_CHARS = 500;

export function ProposalEdit({
  initialFront,
  initialBack,
  onSave,
  onCancel,
}: ProposalEditProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setFront(text);

    if (text.trim().length === 0) {
      setFrontError("Front text is required");
    } else if (text.length > MAX_FRONT_CHARS) {
      setFrontError(
        `Front text must not exceed ${MAX_FRONT_CHARS} characters (current: ${text.length})`
      );
    } else {
      setFrontError(null);
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBack(text);

    if (text.trim().length === 0) {
      setBackError("Back text is required");
    } else if (text.length > MAX_BACK_CHARS) {
      setBackError(
        `Back text must not exceed ${MAX_BACK_CHARS} characters (current: ${text.length})`
      );
    } else {
      setBackError(null);
    }
  };

  const handleSave = () => {
    if (front.trim().length === 0) {
      setFrontError("Front text is required");
      return;
    }
    if (back.trim().length === 0) {
      setBackError("Back text is required");
      return;
    }
    if (front.length > MAX_FRONT_CHARS || back.length > MAX_BACK_CHARS) {
      return;
    }

    onSave(front, back);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const isValid =
    front.trim().length > 0 &&
    front.length <= MAX_FRONT_CHARS &&
    back.trim().length > 0 &&
    back.length <= MAX_BACK_CHARS;

  return (
    <Card onKeyDown={handleKeyDown}>
      <CardHeader>
        <h3 className="text-sm font-medium text-muted-foreground">
          Edit Flashcard
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="front-edit"
            className="text-sm font-semibold text-muted-foreground"
          >
            Front
          </label>
          <Input
            id="front-edit"
            value={front}
            onChange={handleFrontChange}
            placeholder="Question or prompt"
            aria-describedby="front-counter front-error"
            className={frontError ? "border-destructive" : ""}
          />
          <div className="flex items-center justify-between">
            <CharacterCounter
              count={front.length}
              min={1}
              max={MAX_FRONT_CHARS}
            />
          </div>
          {frontError && (
            <p id="front-error" className="text-sm font-medium text-destructive">
              {frontError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="back-edit"
            className="text-sm font-semibold text-muted-foreground"
          >
            Back
          </label>
          <Textarea
            id="back-edit"
            value={back}
            onChange={handleBackChange}
            placeholder="Answer or explanation"
            className={`min-h-[100px] resize-y ${backError ? "border-destructive" : ""}`}
            aria-describedby="back-counter back-error"
          />
          <div className="flex items-center justify-between">
            <CharacterCounter
              count={back.length}
              min={1}
              max={MAX_BACK_CHARS}
            />
          </div>
          {backError && (
            <p id="back-error" className="text-sm font-medium text-destructive">
              {backError}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleSave} disabled={!isValid} size="sm">
          Save
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}