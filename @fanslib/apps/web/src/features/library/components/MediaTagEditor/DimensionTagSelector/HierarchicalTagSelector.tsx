import type { TagDefinitionSchema } from "@fanslib/server/schemas";
import { Fragment, type ReactNode } from "react";
import type { SelectionState } from "~/lib/tags/selection-state";
import { TagBadge } from "./TagBadge";

type TagDefinition = typeof TagDefinitionSchema.static;

type HierarchicalTagSelectorProps = {
  tags: TagDefinition[];
  tagStates: Record<number, SelectionState>;
  onTagToggle: (tagId: number) => void;
};

type TagNode = TagDefinition & {
  children: TagNode[];
};

const buildTagTree = (tags: TagDefinition[]): TagNode[] => {
  const tagMap = new Map<number, TagNode>();
  const roots: TagNode[] = [];

  // First pass: create nodes
  tags.forEach((tag) => {
    tagMap.set(tag.id, { ...tag, children: [] });
  });

  // Second pass: build tree
  tags.forEach((tag) => {
    const node = tagMap.get(tag.id)!;
    const parentId = tag.parentTagId;

    parentId === null || !tagMap.has(parentId)
      ? roots.push(node)
      : tagMap.get(parentId)!.children.push(node);
  });

  return roots;
};

const getDescendantIds = (node: TagNode): number[] => [
  node.id,
  ...node.children.flatMap(getDescendantIds),
];

const isTagOrDescendantSelected = (
  node: TagNode,
  tagStates: Record<number, SelectionState>
): boolean =>
  getDescendantIds(node).some((id) => tagStates[id] === "checked");

export const HierarchicalTagSelector = ({
  tags,
  tagStates,
  onTagToggle,
}: HierarchicalTagSelectorProps) => {
  const tree = buildTagTree(tags);

  const renderNode = (node: TagNode): ReactNode => {
    const hasSelectedDescendant = isTagOrDescendantSelected(node, tagStates);
    const showChildren = hasSelectedDescendant && node.children.length > 0;

    return (
      <Fragment key={node.id}>
        <TagBadge
          tag={node}
          selectionState={tagStates[node.id] ?? "unchecked"}
          onClick={() => onTagToggle(node.id)}
          selectionMode="checkbox"
        />
        {showChildren && (
          <div className="ml-4 flex flex-wrap gap-1.5">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </Fragment>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {tree.map((node) => renderNode(node))}
    </div>
  );
};
