import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type LinkedPostsContextValue = {
  expandedPostId: string | null;
  setExpandedPostId: (postId: string | null) => void;
  linkedPostIdsForExpanded: Set<string>;
  setLinkedPostIds: (sourcePostId: string, ids: string[]) => void;
};

const LinkedPostsContext = createContext<LinkedPostsContextValue | null>(null);

export const useLinkedPostsContext = () => {
  const context = useContext(LinkedPostsContext);
  if (!context) {
    throw new Error("useLinkedPostsContext must be used within LinkedPostsProvider");
  }
  return context;
};

export const LinkedPostsProvider = ({ children }: { children: ReactNode }) => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [selectionsBySource, setSelectionsBySource] = useState<Map<string, string[]>>(new Map());

  const linkedPostIdsForExpanded = useMemo(() => {
    if (!expandedPostId) return new Set<string>();
    const ids = selectionsBySource.get(expandedPostId) ?? [];
    return new Set(ids);
  }, [expandedPostId, selectionsBySource]);

  const setLinkedPostIds = useCallback((sourcePostId: string, ids: string[]) => {
    setSelectionsBySource((prev) => {
      const next = new Map(prev);
      next.set(sourcePostId, ids);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ expandedPostId, setExpandedPostId, linkedPostIdsForExpanded, setLinkedPostIds }),
    [expandedPostId, linkedPostIdsForExpanded, setLinkedPostIds]
  );

  return (
    <LinkedPostsContext.Provider value={value}>
      {children}
    </LinkedPostsContext.Provider>
  );
};
