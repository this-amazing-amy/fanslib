import type { TagDefinition } from "@fanslib/types";
import { createContext, useContext, useState, type FC, type ReactNode } from "react";

type TagDragContextType = {
  draggedTag: TagDefinition | null;
  startTagDrag: (e: React.DragEvent<HTMLDivElement>, tag: TagDefinition) => void;
  endTagDrag: () => void;
  isDragging: boolean;
};

const TagDragContext = createContext<TagDragContextType | null>(null);

type TagDragProviderProps = {
  children: ReactNode;
};

export const TagDragProvider: FC<TagDragProviderProps> = ({ children }) => {
  const [draggedTag, setDraggedTag] = useState<TagDefinition | null>(null);

  const startTagDrag = (e: React.DragEvent<HTMLDivElement>, tag: TagDefinition) => {
    e.dataTransfer.setData("text/plain", tag.id.toString());
    e.dataTransfer.effectAllowed = "move";
    setDraggedTag(tag);
  };

  const endTagDrag = () => {
    setDraggedTag(null);
  };

  const isDragging = draggedTag !== null;

  return (
    <TagDragContext.Provider
      value={{
        draggedTag,
        startTagDrag,
        endTagDrag,
        isDragging,
      }}
    >
      {children}
    </TagDragContext.Provider>
  );
};

export const useTagDrag = (): TagDragContextType => {
  const context = useContext(TagDragContext);
  if (!context) {
    throw new Error("useTagDrag must be used within a TagDragProvider");
  }
  return context;
};
