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

  const unselectedNodes = tree.filter((node) => !isTagOrDescendantSelected(node, tagStates));
  const selectedNodes = tree.filter((node) => isTagOrDescendantSelected(node, tagStates));

  const renderNode = (node: TagNode, depth: number = 0): ReactNode => {
    const hasSelectedDescendant = isTagOrDescendantSelected(node, tagStates);
    const showChildren = hasSelectedDescendant && node.children.length > 0;
    const size = depth === 0 ? "lg" : "sm";

    return (
      <Fragment key={node.id}>
        {showChildren && <div className="w-full" />}
        <TagBadge
          tag={node}
          selectionState={tagStates[node.id] ?? "unchecked"}
          onClick={() => onTagToggle(node.id)}
          selectionMode="checkbox"
          size={size}
        />
        {showChildren && (
          <div className="w-full flex flex-wrap gap-1.5 ml-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </Fragment>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {selectedNodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNodes.map((node) => renderNode(node))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {unselectedNodes.map((node) => renderNode(node))}
      </div>
    </div>
  );
};
