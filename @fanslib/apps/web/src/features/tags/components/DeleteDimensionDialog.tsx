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
  <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Dimension</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete the "{dimensionName}" dimension? This will also delete all
          tags in this dimension. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel isDisabled={isDeleting}>Cancel</AlertDialogCancel>
        <AlertDialogAction className="btn-error" onPress={onConfirm} isDisabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete Dimension"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
