import type { ShootSummary } from "@fanslib/types";
import { Trash2 } from "lucide-react";
import { type FC } from "react";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/AlertDialog";
import { Button } from "~/components/ui/Button";
import { useDeleteShootMutation } from "~/lib/queries/shoots";

type ShootDetailDeleteButtonProps = {
  shoot: ShootSummary;
  onUpdate: () => void;
};

export const ShootDetailDeleteButton: FC<ShootDetailDeleteButtonProps> = ({ shoot, onUpdate }) => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const deleteMutation = useDeleteShootMutation();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(shoot.id);

    // Remove any filter groups that include this shoot
    const updatedFilters = preferences.filter
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !(item.type === "shoot" && item.id === shoot.id)),
      }))
      .filter((group) => group.items.length > 0);

    if (
      updatedFilters.length !== preferences.filter.length ||
      preferences.filter.some((group) =>
        group.items.some((item) => item.type === "shoot" && item.id === shoot.id)
      )
    ) {
      updatePreferences({
        filter: updatedFilters,
      });
    }

    onUpdate?.();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <Trash2 /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete shoot?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the shoot &quot;{shoot.name}&quot;. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
