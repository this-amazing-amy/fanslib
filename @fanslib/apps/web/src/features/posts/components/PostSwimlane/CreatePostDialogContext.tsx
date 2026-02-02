import { createContext, useCallback, useContext, useState } from "react";
import type { Media, PostWithRelations } from '@fanslib/server/schemas';
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import type { VirtualPost } from "~/lib/virtual-posts";


type CreatePostDialogData = {
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  initialCaption?: string;
  scheduleId?: string;
  initialMediaSelectionExpanded?: boolean;
  allPosts?: (PostWithRelations | VirtualPost)[];
  virtualPost?: VirtualPost;
};

type CreatePostDialogContextValue = {
  openCreatePostDialog: (data: CreatePostDialogData) => void;
};

const CreatePostDialogContext = createContext<CreatePostDialogContextValue | null>(null);

type CreatePostDialogProviderProps = {
  children: React.ReactNode;
  onUpdate?: () => Promise<void>;
};

export const CreatePostDialogProvider = ({
  children,
  onUpdate,
}: CreatePostDialogProviderProps) => {
  const [dialogData, setDialogData] = useState<CreatePostDialogData | null>(null);

  const openCreatePostDialog = useCallback((data: CreatePostDialogData) => {
    setDialogData(data);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogData(null);
    onUpdate?.();
  }, [onUpdate]);
  
  const handleNavigateToSlot = useCallback((virtualPost: VirtualPost) => {
    setDialogData((prev) => ({
      ...prev,
      media: [],
      initialDate: new Date(virtualPost.date),
      initialChannelId: virtualPost.channelId,
      scheduleId: virtualPost.scheduleId ?? undefined,
      virtualPost,
    }));
  }, []);

  return (
    <CreatePostDialogContext.Provider value={{ openCreatePostDialog }}>
      {children}
      <CreatePostDialog
        open={dialogData !== null}
        onOpenChange={closeDialog}
        media={dialogData?.media ?? []}
        initialDate={dialogData?.initialDate}
        initialChannelId={dialogData?.initialChannelId}
        initialCaption={dialogData?.initialCaption}
        scheduleId={dialogData?.scheduleId}
        initialMediaSelectionExpanded={dialogData?.initialMediaSelectionExpanded}
        allPosts={dialogData?.allPosts}
        virtualPost={dialogData?.virtualPost}
        onNavigateToSlot={handleNavigateToSlot}
      />
    </CreatePostDialogContext.Provider>
  );
};

export const useCreatePostDialog = (): CreatePostDialogContextValue => {
  const context = useContext(CreatePostDialogContext);
  if (!context) {
    throw new Error("useCreatePostDialog must be used within CreatePostDialogProvider");
  }
  return context;
};

