import { useState } from "react";
import { ProposalDisplay } from "./ProposalDisplay";
import { ProposalEdit } from "./ProposalEdit";
import type { ProposalCardProps } from "./GenerateView.types";

export function ProposalCard({
  proposal,
  index,
  onAccept,
  onEdit,
  onReject,
}: ProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleAccept = () => {
    onAccept(index);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleReject = () => {
    onReject(index);
  };

  const handleSaveEdit = (front: string, back: string) => {
    onEdit(index, front, back);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const displayFront =
    proposal.status === "edited" && proposal.editedFront
      ? proposal.editedFront
      : proposal.original.front;

  const displayBack =
    proposal.status === "edited" && proposal.editedBack
      ? proposal.editedBack
      : proposal.original.back;

  if (isEditing) {
    return (
      <ProposalEdit
        initialFront={displayFront}
        initialBack={displayBack}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <ProposalDisplay
      front={displayFront}
      back={displayBack}
      status={proposal.status}
      onAccept={handleAccept}
      onEdit={handleEditClick}
      onReject={handleReject}
    />
  );
}