import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Textarea } from "~/components/ui/Textarea";
import { ParentTagSelector } from "./ParentTagSelector";

type CategoricalValueInputProps = {
  displayName: string;
  value: string;
  description: string;
  parentTagId: number | null;
  shortRepresentation: string;
  availableTags: any[];
  currentTagId?: number;
  onDisplayNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onParentTagChange: (parentId: number | null) => void;
  onShortRepresentationChange: (value: string) => void;
};

export const CategoricalValueInput = ({
  displayName,
  value,
  description,
  parentTagId,
  shortRepresentation,
  availableTags,
  currentTagId,
  onDisplayNameChange,
  onValueChange,
  onDescriptionChange,
  onParentTagChange,
  onShortRepresentationChange,
}: CategoricalValueInputProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="displayName">Tag Name *</Label>
      <Input
        id="displayName"
        value={displayName}
        onChange={onDisplayNameChange}
        placeholder="e.g., Portrait, Landscape, Action"
        isRequired
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="value">Value</Label>
      <Input
        id="value"
        value={value}
        onChange={onValueChange}
        placeholder="Auto-generated from name if empty"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={description}
        onChange={onDescriptionChange}
        placeholder="Optional description for this tag"
        rows={3}
      />
    </div>

    <div className="space-y-2">
      <Label>Parent Tag</Label>
      <ParentTagSelector
        tags={availableTags}
        selectedParentId={parentTagId}
        currentTagId={currentTagId}
        onSelectParent={onParentTagChange}
        placeholder="Select parent tag (optional)"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="shortRepresentation">Short Representation</Label>
      <Input
        id="shortRepresentation"
        value={shortRepresentation}
        onChange={onShortRepresentationChange}
        placeholder="e.g., $, ★, HD, 4K"
      />
    </div>
  </div>
);
