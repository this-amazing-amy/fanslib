import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/AlertDialog";

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
  <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this tag? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel isDisabled={isDeleting}>Cancel</AlertDialogCancel>
        <AlertDialogAction className="btn-error" onPress={onConfirm} isDisabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete Tag"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
