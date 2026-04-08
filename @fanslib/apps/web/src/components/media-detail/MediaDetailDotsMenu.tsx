import { useNavigate } from "@tanstack/react-router";
import type { Key } from "@react-types/shared";
import { Image, MoreVertical, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { DeleteConfirmDialog } from "~/components/ui/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { useDeleteMediaMutation } from "~/lib/queries/library";
import { QUERY_KEYS } from "~/lib/queries/query-keys";
import { api } from "~/lib/api/hono-client";

type MediaDetailDotsMenuProps = {
  id: string;
  mediaType: "image" | "video";
  onCreatePost?: () => void;
};

export const MediaDetailDotsMenu = ({ id, mediaType, onCreatePost }: MediaDetailDotsMenuProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteFile, setDeleteFile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteMediaMutation();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id, deleteFile });
      navigate({ to: "/content/library/media" });
    } catch (error) {
      console.error("Failed to delete media:", error);
    }
  };

  const handleGenerateThumbnail = async () => {
    try {
      await api.api.media[":id"].thumbnail.$post({
        param: { id },
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.byId(id) });
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
    }
  };

  const handleAction = (key: Key) => {
    const actionId = String(key);
    if (actionId === "create-post" && onCreatePost) {
      onCreatePost();
    } else if (actionId === "generate-thumbnail") {
      handleGenerateThumbnail();
    } else if (actionId === "delete") {
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    <>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="bg-base-100 text-base-content hover:bg-base-200"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
        <DropdownMenuPopover placement="bottom end" className="w-56">
          <DropdownMenu onAction={handleAction}>
            {onCreatePost && (
              <DropdownMenuItem
                id="create-post"
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Send className="h-4 w-4 shrink-0" />
                Create post with media
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              id="generate-thumbnail"
              className="flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              <Image className="h-4 w-4 shrink-0" />
              Generate Thumbnail
            </DropdownMenuItem>
            <DropdownMenuItem
              id="delete"
              className="flex items-center gap-2 text-sm font-medium text-destructive"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete Media
            </DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuPopover>
      </DropdownMenuTrigger>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Media"
        description={`This will permanently delete this ${mediaType}. This action cannot be undone.`}
        itemName={`${mediaType}`}
        onConfirm={handleDelete}
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="delete-file"
            isSelected={deleteFile}
            onChange={(isSelected) => setDeleteFile(isSelected)}
          >
            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Also delete file from disk
            </span>
          </Checkbox>
        </div>
      </DeleteConfirmDialog>
    </>
  );
};
