import type { TagDefinition } from '@fanslib/server/schemas';
import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/Select";


type ParentTagSelectorProps = {
  tags: TagDefinition[];
  selectedParentId?: number | null;
  currentTagId?: number;
  onSelectParent: (parentId: number | null) => void;
  placeholder?: string;
};

type HierarchicalTag = {
  tag: TagDefinition;
  level: number;
  path: string[];
};

const buildHierarchicalList = (tags: TagDefinition[], excludeTagId?: number): HierarchicalTag[] => {
  const tagMap = new Map<number, TagDefinition>();
  tags.forEach((tag) => tagMap.set(tag.id, tag));

  const getPath = (tagId: number): string[] => {
    const tag = tagMap.get(tagId);
    if (!tag) return [];

    if (tag.parentTagId) {
      return [...getPath(tag.parentTagId), tag.displayName];
    }
    return [tag.displayName];
  };

  const getLevel = (tagId: number): number => {
    const tag = tagMap.get(tagId);
    if (!tag?.parentTagId) return 0;
    return getLevel(tag.parentTagId) + 1;
  };

  const isDescendantOf = (tagId: number, ancestorId: number): boolean => {
    const tag = tagMap.get(tagId);
    if (!tag) return false;
    if (tag.parentTagId === ancestorId) return true;
    if (tag.parentTagId) return isDescendantOf(tag.parentTagId, ancestorId);
    return false;
  };

  return tags
    .filter((tag) => {
      if (excludeTagId) {
        return tag.id !== excludeTagId && !isDescendantOf(tag.id, excludeTagId);
      }
      return true;
    })
    .map((tag) => ({
      tag,
      level: getLevel(tag.id),
      path: getPath(tag.id),
    }))
    .sort((a, b) => {
      const pathA = a.path.join(" > ").toLowerCase();
      const pathB = b.path.join(" > ").toLowerCase();
      return pathA.localeCompare(pathB);
    });
};

export const ParentTagSelector = ({
  tags,
  selectedParentId,
  currentTagId,
  onSelectParent,
  placeholder = "Select parent tag...",
}: ParentTagSelectorProps) => {
  const hierarchicalTags = useMemo(() => buildHierarchicalList(tags, currentTagId), [tags, currentTagId]);

  const getDisplayValue = (item: HierarchicalTag) => {
    if (item.path.length > 1) {
      return item.path.join(" > ");
    }
    return item.tag.displayName;
  };

  return (
    <Select
      value={selectedParentId ? String(selectedParentId) : "none"}
      onValueChange={(value) => onSelectParent(value === "none" ? null : Number(value))}
      aria-label="Parent tag"
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None (Root Level)</SelectItem>
        {hierarchicalTags.map((item) => (
          <SelectItem key={item.tag.id} value={String(item.tag.id)}>
            {getDisplayValue(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
