import type { TagDefinition, TagDefinitionSchema } from '@fanslib/server/schemas';
import { ColorPicker } from "~/components/ui/ColorPicker";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Textarea } from "~/components/ui/Textarea";
import { ParentTagSelector } from "./ParentTagSelector";


type CategoricalValueInputProps = {
  displayName: string;
  description: string;
  parentTagId: number | null;
  shortRepresentation: string;
  color: string | null;
  availableTags: TagDefinition[];
  currentTagId?: number;
  onDisplayNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onParentTagChange: (parentId: number | null) => void;
  onShortRepresentationChange: (value: string) => void;
  onColorChange: (value: string | null) => void;
};

export const CategoricalValueInput = ({
  displayName,
  description,
  parentTagId,
  shortRepresentation,
  color,
  availableTags,
  currentTagId,
  onDisplayNameChange,
  onDescriptionChange,
  onParentTagChange,
  onShortRepresentationChange,
  onColorChange,
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
      <Label htmlFor="shortRepresentation">Representation</Label>
      <div className="flex items-center gap-3">
        <ColorPicker value={color} onChange={onColorChange} className="rounded-full" />
        <Input
          id="shortRepresentation"
          value={shortRepresentation}
          onChange={onShortRepresentationChange}
          placeholder="e.g., $, ★, HD, 4K"
          className="flex-1"
        />
      </div>
    </div>
  </div>
);
