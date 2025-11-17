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

type DeleteDimensionDialogProps = {
  isOpen: boolean;
  dimensionName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
};

export const DeleteDimensionDialog = ({
  isOpen,
  dimensionName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteDimensionDialogProps) => (
  <AlertDialogTrigger isOpen={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogModal isDismissable={false}>
      <AlertDialog>
        {({ close }) => (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Dimension</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the "{dimensionName}" dimension? This will also delete all
                tags in this dimension. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="ghost" onPress={close} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="error"
                onPress={async () => {
                  await onConfirm();
                  close();
                }}
                isDisabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Dimension"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialog>
    </AlertDialogModal>
  </AlertDialogTrigger>
);
