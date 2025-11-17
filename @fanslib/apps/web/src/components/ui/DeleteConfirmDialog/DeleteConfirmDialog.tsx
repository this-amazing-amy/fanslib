import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogModal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../AlertDialog';
import { Button } from '../Button';

export type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  children?: ReactNode;
};

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemType = 'item',
  onConfirm,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  children,
}: DeleteConfirmDialogProps) => {
  const defaultTitle = title ?? `Delete ${itemType}`;
  const defaultDescription =
    description ??
    `Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType}`}? This action cannot be undone.`;

  return (
    <AlertDialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      <AlertDialogModal isDismissable={false}>
        <AlertDialog>
          {({ close }) => (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{defaultTitle}</AlertDialogTitle>
                <AlertDialogDescription>{defaultDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              {children}
              <AlertDialogFooter>
                <Button variant="ghost" onPress={close} isDisabled={isLoading}>
                  {cancelText}
                </Button>
                <Button
                  variant="error"
                  onPress={async () => {
                    await onConfirm();
                    close();
                  }}
                  isDisabled={isLoading}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Deleting...' : confirmText}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialog>
      </AlertDialogModal>
    </AlertDialogTrigger>
  );
};

