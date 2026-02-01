import type { Media, MediaSchema } from '@fanslib/server/schemas';


import { Camera, FolderPlus, Send, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { TagAssigner } from "~/features/library/components/Gallery/GalleryActionBar/TagAssigner";
import { AddToShootDialog } from "~/features/shoots/components/AddToShootDialog";
import { CreateShootDialog } from "~/features/shoots/components/CreateShootDialog";
import { cn } from "~/lib/cn";

type GalleryActionBarProps = {
  selectedCount: number;
  selectedMedia: Media[];
  onClearSelection: () => void;
};

export const GalleryActionBar = ({
  selectedCount,
  selectedMedia,
  onClearSelection,
}: GalleryActionBarProps) => {
  const [isCreateShootDialogOpen, setIsCreateShootDialogOpen] = useState(false);
  const [isAddToShootDialogOpen, setIsAddToShootDialogOpen] = useState(false);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="bg-base-100 fixed bottom-6 left-0 right-0 flex justify-center z-50">
      <div
        className={cn(
          "w-[70%] bg-background",
          "border shadow-lg rounded-lg",
          "p-4",
          "grid grid-rows-[auto_auto] grid-cols-[1fr_auto] items-center justify-between",
          "transform transition-all duration-300 ease-out",
          selectedCount > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex gap-4 row-span-2 items-center">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsCreateShootDialogOpen(true)}
          >
            <Camera className="h-4 w-4" />
            Create Shoot
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsAddToShootDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            Add to Shoot
          </Button>

          <TagAssigner selectedMedia={selectedMedia} />

          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsCreatePostDialogOpen(true)}
          >
            <Send className="h-4 w-4" />
            Create Post
          </Button>
        </div>
        <div className="flex items-center justify-end gap-3 w-full">
          <div className="text-sm text-muted-foreground">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </div>
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CreateShootDialog
        open={isCreateShootDialogOpen}
        onOpenChange={setIsCreateShootDialogOpen}
        selectedMedia={selectedMedia}
        onSuccess={onClearSelection}
      />

      <AddToShootDialog
        open={isAddToShootDialogOpen}
        onOpenChange={setIsAddToShootDialogOpen}
        selectedMedia={selectedMedia}
        onSuccess={onClearSelection}
      />

      <CreatePostDialog
        open={isCreatePostDialogOpen}
        onOpenChange={setIsCreatePostDialogOpen}
        media={selectedMedia}
      />
    </div>
  );
};
