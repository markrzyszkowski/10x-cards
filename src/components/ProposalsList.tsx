import { ProposalCard } from "./ProposalCard";
import { SaveActionsBar } from "./SaveActionsBar";
import type { ProposalsListProps } from "./GenerateView.types";

export function ProposalsList({
  proposals,
  generationId,
  onAccept,
  onEdit,
  onReject,
  onSaveAll,
  isSaving,
}: ProposalsListProps) {
  const acceptedCount = proposals.filter(
    (p) => p.status === "accepted" || p.status === "edited"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Generated Flashcards</h2>
        <p className="text-sm text-muted-foreground">
          {proposals.length} proposal{proposals.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {proposals.map((proposal, index) => (
          <ProposalCard
            key={index}
            proposal={proposal}
            index={index}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
          />
        ))}
      </div>

      <SaveActionsBar
        acceptedCount={acceptedCount}
        onSaveAll={onSaveAll}
        isSaving={isSaving}
      />
    </div>
  );
}