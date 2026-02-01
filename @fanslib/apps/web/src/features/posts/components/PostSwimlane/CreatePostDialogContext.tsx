import { createContext, useCallback, useContext, useState } from "react";
import type { Media, MediaSchema } from '@fanslib/server/schemas';
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";


type CreatePostDialogData = {
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  initialCaption?: string;
  scheduleId?: string;
  initialMediaSelectionExpanded?: boolean;
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

