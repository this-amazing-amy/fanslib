import type { Post } from "@fanslib/types";
import { createContext, useContext, useState, type FC, type ReactNode } from "react";

type PostDragContextType = {
  draggedPost: Post | null;
  startPostDrag: (e: React.DragEvent<HTMLDivElement>, post: Post) => void;
  endPostDrag: () => void;
  isDragging: boolean;
};

const PostDragContext = createContext<PostDragContextType | undefined>(undefined);

type PostDragProviderProps = {
  children: ReactNode;
};

export const PostDragProvider: FC<PostDragProviderProps> = ({ children }) => {
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);

  const startPostDrag = (_: React.DragEvent<HTMLDivElement>, post: Post) => {
    setDraggedPost(post);
  };

  const endPostDrag = () => {
    setDraggedPost(null);
  };

  const isDragging = draggedPost !== null;

  return (
    <PostDragContext.Provider
      value={{
        draggedPost,
        startPostDrag,
        endPostDrag,
        isDragging,
      }}
    >
      {children}
    </PostDragContext.Provider>
  );
};

export const usePostDrag = (): PostDragContextType => {
  const context = useContext(PostDragContext);
  if (!context) {
    throw new Error("usePostDrag must be used within a PostDragProvider");
  }
  return context;
};
