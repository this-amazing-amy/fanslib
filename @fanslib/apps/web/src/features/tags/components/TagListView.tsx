import type { TagDefinitionSchema } from "@fanslib/server/schemas";
import { TagListItem } from "./TagListItem";

type TagDefinition = typeof TagDefinitionSchema.static;

type TagListViewProps = {
  tags: TagDefinition[];
  selectedTagId?: number;
  onSelectTag?: (tagId: number) => void;
  onEditTag: (tag: TagDefinition) => void;
  onDeleteTag: (tagId: number) => void;
};

export const TagListView = ({ tags, selectedTagId, onSelectTag, onEditTag, onDeleteTag }: TagListViewProps) => {
  const sortedTags = [...tags].sort((a, b) => a.displayName.localeCompare(b.displayName));

  if (sortedTags.length === 0) {
    return (
      <div className="text-center py-4 text-base-content/60">
        <p>No tags to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedTags.map((tag) => (
        <TagListItem
          key={tag.id}
          tag={tag}
          isSelected={selectedTagId === tag.id}
          onSelect={() => onSelectTag?.(tag.id)}
          onEdit={() => onEditTag(tag)}
          onDelete={() => onDeleteTag(tag.id)}
        />
      ))}
    </div>
  );
};
