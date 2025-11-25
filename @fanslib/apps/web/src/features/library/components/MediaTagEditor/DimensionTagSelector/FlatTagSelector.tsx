import type { TagDefinitionSchema } from "@fanslib/server/schemas";
import type { SelectionState } from "~/lib/tags/selection-state";
import { TagBadge } from "./TagBadge";

type TagDefinition = typeof TagDefinitionSchema.static;

type FlatTagSelectorProps = {
  tags: TagDefinition[];
  tagStates: Record<number, SelectionState>;
  onTagToggle: (tagId: number) => void;
};

export const FlatTagSelector = ({
  tags,
  tagStates,
  onTagToggle,
}: FlatTagSelectorProps) => (
  <div className="flex flex-wrap gap-2">
    {tags.map((tag) => (
      <TagBadge
        key={tag.id}
        tag={tag}
        selectionState={tagStates[tag.id] ?? "unchecked"}
        onClick={() => onTagToggle(tag.id)}
        selectionMode="radio"
      />
    ))}
  </div>
);
