import { useState } from "react";

type UseDragOverOptions = {
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  shouldStopPropagation?: boolean;
};

export const useDragOver = ({
  onDragOver,
  onDragLeave,
  onDrop,
  shouldStopPropagation = false,
}: UseDragOverOptions = {}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (shouldStopPropagation) {
      e.stopPropagation();
    }
    e.dataTransfer.dropEffect = "copy";
    setIsOver(true);
    onDragOver?.(e);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (shouldStopPropagation) {
      e.stopPropagation();
    }

    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsOver(false);
      onDragLeave?.(e);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    onDrop?.(e);
  };

  return {
    isOver,
    dragHandlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    setIsOver,
  };
};
