import type { ReactNode } from 'react';
import type { OverlayTriggerState } from 'react-stately';
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../AlertDialog';

export type DeleteConfirmDialogProps = {
  state: OverlayTriggerState;
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
  state,
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
    <AlertDialog state={state}>
      <AlertDialogHeader>
        <AlertDialogTitle>{defaultTitle}</AlertDialogTitle>
        <AlertDialogDescription>{defaultDescription}</AlertDialogDescription>
      </AlertDialogHeader>
      {children}
      <AlertDialogFooter>
        <AlertDialogCancel onPress={() => state.close()} isDisabled={isLoading}>
          {cancelText}
        </AlertDialogCancel>
        <AlertDialogAction onPress={onConfirm} isDisabled={isLoading} isLoading={isLoading}>
          {isLoading ? 'Deleting...' : confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  );
};

