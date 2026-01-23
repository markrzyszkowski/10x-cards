import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProposalDisplayProps } from "./GenerateView.types";

export function ProposalDisplay({ front, back, status, onAccept, onEdit, onReject, index }: ProposalDisplayProps & { index: number }) {
  const getBadgeVariant = () => {
    switch (status) {
      case "accepted":
        return "default";
      case "edited":
        return "secondary";
      case "rejected":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "edited":
        return "Edited";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const isRejected = status === "rejected";
  const isAcceptedOrEdited = status === "accepted" || status === "edited";

  return (
    <Card className={isRejected ? "opacity-50" : ""} data-test-id={`proposal-card-${index}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Badge variant={getBadgeVariant()} data-test-id={`proposal-status-badge-${index}`}>{getStatusLabel()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Front</h4>
          <p className="text-base font-medium" data-test-id={`proposal-front-text-${index}`}>{front}</p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Back</h4>
          <p className="text-sm" data-test-id={`proposal-back-text-${index}`}>{back}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="default" size="sm" onClick={onAccept} disabled={isAcceptedOrEdited} data-test-id={`proposal-accept-button-${index}`}>
          {isAcceptedOrEdited ? "Accepted" : "Accept"}
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} disabled={isRejected} data-test-id={`proposal-edit-button-${index}`}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onReject} disabled={isRejected} data-test-id={`proposal-reject-button-${index}`}>
          {isRejected ? "Rejected" : "Reject"}
        </Button>
      </CardFooter>
    </Card>
  );
}
