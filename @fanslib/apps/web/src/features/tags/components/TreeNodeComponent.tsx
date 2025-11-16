import { ChevronDown, ChevronRight, Edit, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { useTagDrag } from "~/contexts/TagDragContext";
import { useTagDropZone } from "~/hooks/useTagDropZone";
import { cn } from "~/lib/cn";

export type TreeNode = {
  id: number;
  displayName: string;
  description?: string | null;
  value: string;
  parentTagId?: number | null;
  dimensionId: number;
  children: TreeNode[];
  level: number;
};

type TreeNodeComponentProps = {
  node: TreeNode;
  onUpdateParent: (tagId: number, newParentId: number | null) => void;
  onDeleteTag: (tagId: number) => void;
  onCreateTag: (parentTagId?: number) => void;
  onEditTag: (tag: any) => void;
  selectedTagId?: number;
  onSelectTag?: (tagId: number) => void;
  allTags: any[];
};

export const TreeNodeComponent = ({
  node,
  onUpdateParent,
  onDeleteTag,
  onCreateTag,
  onEditTag,
  selectedTagId,
  onSelectTag,
  allTags,
}: TreeNodeComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { startTagDrag } = useTagDrag();
  const { isOver, dragHandlers } = useTagDropZone({
    targetTag: node,
    allTags,
    onUpdateParent,
  });

  const hasChildren = node.children.length > 0;
  const isSelected = selectedTagId === node.id;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded group hover:bg-base-200/50 transition-colors",
          isSelected && "bg-primary/10 border border-primary/30",
          isOver && "bg-secondary/20 border-2 border-secondary border-dashed"
        )}
        style={{ marginLeft: `${node.level * 20}px` }}
        {...dragHandlers}
        onClick={() => onSelectTag?.(node.id)}
      >
        <div
          className="cursor-move"
          draggable
          onDragStart={(e) => startTagDrag(e, node)}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-base-content/40 opacity-0 group-hover:opacity-100" />
        </div>

        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onPress={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </Button>
        ) : (
          <div className="w-4" />
        )}

        <span className="flex-1 text-sm font-medium">{node.displayName}</span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onPress={(e) => {
              e.stopPropagation();
              onCreateTag(node.id);
            }}
            aria-label={`Add child tag to ${node.displayName}`}
          >
            <Plus className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onPress={(e) => {
              e.stopPropagation();
              onEditTag(node);
            }}
            aria-label={`Edit ${node.displayName}`}
          >
            <Edit className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-error hover:text-error"
            onPress={(e) => {
              e.stopPropagation();
              onDeleteTag(node.id);
            }}
            aria-label={`Delete ${node.displayName}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onUpdateParent={onUpdateParent}
              onDeleteTag={onDeleteTag}
              onCreateTag={onCreateTag}
              onEditTag={onEditTag}
              selectedTagId={selectedTagId}
              onSelectTag={onSelectTag}
              allTags={allTags}
            />
          ))}
        </div>
      )}
    </div>
  );
};
