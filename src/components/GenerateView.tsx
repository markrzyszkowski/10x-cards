import { GenerationForm } from "./GenerationForm";
import { ProposalsList } from "./ProposalsList";
import { LoadingState } from "./LoadingState";
import { ErrorMessage } from "./ErrorMessage";
import { SuccessMessage } from "./SuccessMessage";
import { useFlashcardGeneration } from "./hooks/useFlashcardGeneration";

export function GenerateView() {
  const { viewState, generateFlashcards, acceptProposal, editProposal, rejectProposal, saveFlashcards, retryGenerate } =
    useFlashcardGeneration();

  const handleStartOver = () => {
    retryGenerate();
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Generate Flashcards</h1>
        <p className="text-lg text-muted-foreground">
          Paste your educational text and let AI generate flashcards for you
        </p>
      </div>

      {/* Generation Form - Always visible except during saving and success */}
      {viewState.type !== "saving" && viewState.type !== "success" && (
        <GenerationForm
          onGenerate={generateFlashcards}
          isGenerating={viewState.type === "generating"}
          disabled={viewState.type === "generated"}
        />
      )}

      {/* Loading State */}
      {viewState.type === "generating" && <LoadingState />}

      {/* Success State */}
      {viewState.type === "success" && (
        <SuccessMessage savedCount={viewState.savedCount} onStartOver={handleStartOver} />
      )}

      {/* Error State */}
      {viewState.type === "error" && <ErrorMessage error={viewState.error} onRetry={retryGenerate} />}

      {/* Generated Proposals */}
      {viewState.type === "generated" && (
        <ProposalsList
          proposals={viewState.proposals}
          generationId={viewState.generationMetadata.id}
          onAccept={acceptProposal}
          onEdit={editProposal}
          onReject={rejectProposal}
          onSaveAll={saveFlashcards}
          isSaving={false}
        />
      )}

      {/* Saving State - Show proposals with saving indicator */}
      {viewState.type === "saving" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-lg font-medium">Saving flashcards...</p>
          </div>
        </div>
      )}
    </div>
  );
}
