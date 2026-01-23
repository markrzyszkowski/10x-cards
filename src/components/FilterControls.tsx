import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface FilterControlsProps {
  source: "ai-full" | "ai-edited" | "manual" | undefined;
  sortField: "created_at" | "updated_at" | "front";
  sortOrder: "asc" | "desc";
  onSourceChange: (source: "ai-full" | "ai-edited" | "manual" | undefined) => void;
  onSortFieldChange: (field: "created_at" | "updated_at" | "front") => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
}

export function FilterControls({
  source,
  sortField,
  sortOrder,
  onSourceChange,
  onSortFieldChange,
  onSortOrderChange,
}: FilterControlsProps) {
  const handleSourceChange = (value: string) => {
    if (value === "all") {
      onSourceChange(undefined);
    } else {
      onSourceChange(value as "ai-full" | "ai-edited" | "manual");
    }
  };

  const handleSortFieldChange = (value: string) => {
    onSortFieldChange(value as "created_at" | "updated_at" | "front");
  };

  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Source filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="source-filter" className="text-sm font-medium">
          Source:
        </label>
        <Select value={source || "all"} onValueChange={handleSourceChange}>
          <SelectTrigger id="source-filter" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="ai-full">AI Generated</SelectItem>
            <SelectItem value="ai-edited">AI Edited</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort field */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-field" className="text-sm font-medium">
          Sort by:
        </label>
        <Select value={sortField} onValueChange={handleSortFieldChange}>
          <SelectTrigger id="sort-field" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="updated_at">Updated Date</SelectItem>
            <SelectItem value="front">Question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort order toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortOrder}
        aria-label={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
        title={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
      >
        {sortOrder === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
      </Button>
    </div>
  );
}
