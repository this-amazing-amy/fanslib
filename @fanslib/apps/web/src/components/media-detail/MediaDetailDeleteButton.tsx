import { useNavigate } from "@tanstack/react-router";
import { MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Checkbox } from "~/components/ui/Checkbox";
import { DeleteConfirmDialog } from "~/components/ui/DeleteConfirmDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { useDeleteMediaMutation } from "~/lib/queries/library";

type MediaDetailDeleteButtonProps = {
  id: string;
  mediaType: "image" | "video";
};

export const MediaDetailDeleteButton = ({ id, mediaType }: MediaDetailDeleteButtonProps) => {
  const navigate = useNavigate();
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="bg-base-100 text-base-content hover:bg-base-200"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Media
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

