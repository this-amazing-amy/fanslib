import type { Media } from "@fanslib/types";
import { createContext, useContext, useState, type FC, type ReactNode } from "react";

type MediaDragContextType = {
  draggedMedias: Media[];
  startMediaDrag: (e: React.DragEvent<HTMLDivElement>, medias: Media[]) => void;
  endMediaDrag: () => void;
  isDragging: boolean;
};

const MediaDragContext = createContext<MediaDragContextType | undefined>(undefined);

type MediaDragProviderProps = {
  children: ReactNode;
};

export const MediaDragProvider: FC<MediaDragProviderProps> = ({ children }) => {
  const [draggedMedias, setDraggedMedias] = useState<Media[]>([]);

  const startMediaDrag = (_: React.DragEvent<HTMLDivElement>, medias: Media[]) => {
    setDraggedMedias(medias);
  };

  const endMediaDrag = () => {
    setDraggedMedias([]);
  };

  const isDragging = draggedMedias.length > 0;

  return (
    <MediaDragContext.Provider
      value={{
        draggedMedias,
        startMediaDrag,
        endMediaDrag,
        isDragging,
      }}
    >
      {children}
    </MediaDragContext.Provider>
  );
};

export const useMediaDrag = (): MediaDragContextType => {
  const context = useContext(MediaDragContext);
  if (!context) {
    throw new Error("useMediaDrag must be used within a MediaDragProvider");
  }
  return context;
};
