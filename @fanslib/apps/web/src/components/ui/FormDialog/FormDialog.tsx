import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../Dialog';

export type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  isDismissable?: boolean;
};

export const FormDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  maxWidth = 'lg',
  isDismissable = true,
}: FormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent maxWidth={maxWidth} isDismissable={isDismissable} className={contentClassName}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      <DialogBody className={cn('grid gap-4')}>{children}</DialogBody>
      {footer ? <DialogFooter>{footer}</DialogFooter> : null}
    </DialogContent>
  </Dialog>
);
