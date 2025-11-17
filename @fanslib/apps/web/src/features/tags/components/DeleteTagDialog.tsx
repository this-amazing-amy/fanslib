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

type DeleteTagDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
};

export const DeleteTagDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteTagDialogProps) => (
  <AlertDialogTrigger isOpen={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogModal isDismissable={false}>
      <AlertDialog>
        {({ close }) => (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this tag? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="ghost" onPress={close} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="error"
                onPress={() => {
                  onConfirm();
                  close();
                }}
                isDisabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Tag"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialog>
    </AlertDialogModal>
  </AlertDialogTrigger>
);
