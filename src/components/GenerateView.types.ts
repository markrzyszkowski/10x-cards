import type { FlashcardProposalDTO, GenerationMetadataDTO } from "@/types";

/**
 * Status of a flashcard proposal in the UI
 */
export type ProposalStatus = "pending" | "accepted" | "edited" | "rejected";

/**
 * Flashcard proposal with UI state
 * Extends the DTO with status tracking and edited content
 */
export interface ProposalWithStatus {
  /** Original proposal from AI */
  original: FlashcardProposalDTO;
  /** Current status in UI workflow */
  status: ProposalStatus;
  /** Edited front text (only if status is 'edited') */
  editedFront?: string;
  /** Edited back text (only if status is 'edited') */
  editedBack?: string;
}

/**
 * Overall state of the generation view
 */
export type GenerationViewState =
  | { type: "idle" }
  | { type: "generating" }
  | {
      type: "generated";
      proposals: ProposalWithStatus[];
      generationMetadata: GenerationMetadataDTO;
    }
  | { type: "saving" }
  | { type: "success"; savedCount: number }
  | { type: "error"; error: string };

/**
 * Component Props Interfaces
 */

export interface GenerationFormProps {
  onGenerate: (sourceText: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export interface CharacterCounterProps {
  count: number;
  min: number;
  max: number;
}

export interface ProposalsListProps {
  proposals: ProposalWithStatus[];
  generationId: number;
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
  onSaveAll: () => void;
  isSaving: boolean;
}

export interface ProposalCardProps {
  proposal: ProposalWithStatus;
  index: number;
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export interface ProposalDisplayProps {
  front: string;
  back: string;
  status: ProposalStatus;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export interface ProposalEditProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
}

export interface SaveActionsBarProps {
  acceptedCount: number;
  onSaveAll: () => void;
  isSaving: boolean;
}

export interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}
