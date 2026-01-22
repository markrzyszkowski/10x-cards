import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "./CharacterCounter";
import type { GenerationFormProps } from "./GenerateView.types";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

export function GenerationForm({ onGenerate, isGenerating, disabled = false }: GenerationFormProps) {
  const [sourceText, setSourceText] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setSourceText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceText.trim().length === 0) {
      return;
    }

    if (sourceText.length < MIN_CHARS || sourceText.length > MAX_CHARS) {
      return;
    }

    onGenerate(sourceText);
  };

  const isValid = sourceText.trim().length > 0 && sourceText.length >= MIN_CHARS && sourceText.length <= MAX_CHARS;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <label
          htmlFor="source-text"
          className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-3"
        >
          Source Text
        </label>
        <Textarea
          id="source-text"
          placeholder="Paste your educational text here..."
          value={sourceText}
          onChange={handleChange}
          disabled={isGenerating || disabled}
          className="min-h-[200px] max-h-[200px] resize-y overflow-y-auto"
          aria-describedby="char-counter"
        />
        <div className="flex items-center justify-between">
          <CharacterCounter count={sourceText.length} min={MIN_CHARS} max={MAX_CHARS} />
        </div>
      </div>
      <Button type="submit" disabled={!isValid || isGenerating || disabled} className="w-full sm:w-auto">
        {isGenerating ? "Generating..." : "Generate Flashcards"}
      </Button>
    </form>
  );
}
