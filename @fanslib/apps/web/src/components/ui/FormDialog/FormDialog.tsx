import type { ReactNode } from 'react';
import type { OverlayTriggerState } from 'react-stately';
import { cn } from '~/lib/utils';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../Dialog';

export type FormDialogProps = {
  state: OverlayTriggerState;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  isDismissable?: boolean;
};

export const FormDialog = ({
  state,
  title,
  description,
  children,
  footer,
  contentClassName,
  maxWidth = 'lg',
  isDismissable = true,
}: FormDialogProps) => (
  <Dialog state={state} maxWidth={maxWidth} isDismissable={isDismissable} className={contentClassName}>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      {description ? <DialogDescription>{description}</DialogDescription> : null}
    </DialogHeader>
    <DialogBody className={cn('grid gap-4')}>{children}</DialogBody>
    {footer ? <DialogFooter>{footer}</DialogFooter> : null}
  </Dialog>
);

