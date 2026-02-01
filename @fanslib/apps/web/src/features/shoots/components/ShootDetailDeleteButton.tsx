import type { ShootSummary } from '@fanslib/server/schemas';
import { Trash2 } from "lucide-react";
import { type FC } from "react";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogModal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/AlertDialog";
import { Button } from "~/components/ui/Button";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { useDeleteShootMutation } from "~/lib/queries/shoots";


type ShootDetailDeleteButtonProps = {
  shoot: ShootSummary;
  onUpdate: () => void;
};

export const ShootDetailDeleteButton: FC<ShootDetailDeleteButtonProps> = ({ shoot, onUpdate }) => {
  const { preferences, updatePreferences } = useLibraryPreferences();
  const deleteMutation = useDeleteShootMutation();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: shoot.id });

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
    <AlertDialogTrigger>
      <Button variant="outline" className="text-destructive">
        <Trash2 /> Delete
      </Button>
      <AlertDialogModal isDismissable={false}>
        <AlertDialog>
          {({ close }) => (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete shoot?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the shoot &quot;{shoot.name}&quot;. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onPress={async () => {
                    await handleDelete();
                    close();
                  }}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialog>
      </AlertDialogModal>
    </AlertDialogTrigger>
  );
};
