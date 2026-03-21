import type { PostWithRelations } from "@fanslib/server/schemas";
import { createContext, useContext, useState, type FC, type ReactNode } from "react";
import type { VirtualPost } from "~/lib/virtual-posts";

type Post = PostWithRelations;
type DraggablePost = Post | VirtualPost;

type PostDragContextType = {
  draggedPost: DraggablePost | null;
  startPostDrag: (e: React.DragEvent<HTMLDivElement>, post: DraggablePost) => void;
  endPostDrag: () => void;
  isDragging: boolean;
};

const PostDragContext = createContext<PostDragContextType | undefined>(undefined);

type PostDragProviderProps = {
  children: ReactNode;
};

export const PostDragProvider: FC<PostDragProviderProps> = ({ children }) => {
  const [draggedPost, setDraggedPost] = useState<DraggablePost | null>(null);

  const startPostDrag = (e: React.DragEvent<HTMLDivElement>, post: DraggablePost) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", post.id);
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
