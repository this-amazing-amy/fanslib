import type { ReactNode } from 'react';
import {
  DialogTrigger,
  Modal,
  Dialog as AriaDialog,
  Heading,
  type DialogTriggerProps,
  type ModalOverlayProps,
  type DialogProps as AriaDialogProps,
} from 'react-aria-components';
import { cn } from '~/lib/cn';
import type { ButtonProps } from '../Button';
import { Button } from '../Button';

// Re-export DialogTrigger as AlertDialogTrigger
export { DialogTrigger as AlertDialogTrigger } from 'react-aria-components';

// Modal component for AlertDialog with styled overlay
type AlertDialogModalProps = Omit<ModalOverlayProps, 'children'> & {
  children: ReactNode;
  className?: string;
}

export const AlertDialogModal = ({ children, className, isDismissable = false, ...props }: AlertDialogModalProps) => {
  return (
    <Modal
      isDismissable={isDismissable}
      className={cn(
        'fixed inset-0 z-50 bg-black/50',
        'entering:animate-in entering:fade-in',
        'exiting:animate-out exiting:fade-out',
        className
      )}
      {...props}
    >
      {children}
    </Modal>
  );
};

// AlertDialog component wrapper with content styling
type AlertDialogProps = Omit<AriaDialogProps, 'children'> & {
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const AlertDialog = ({ children, className, maxWidth = 'lg', ...props }: AlertDialogProps) => {
  return (
    <AriaDialog
      role="alertdialog"
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-base-content bg-base-100 p-6 shadow-xl rounded-lg outline-none',
        maxWidthClasses[maxWidth],
        'entering:animate-in entering:fade-in entering:zoom-in-95',
        'entering:slide-in-from-left-1/2 entering:slide-in-from-top-[48%]',
        'exiting:animate-out exiting:fade-out exiting:zoom-out-95',
        'exiting:slide-out-to-left-1/2 exiting:slide-out-to-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
    </AriaDialog>
  );
};

// Helper components for AlertDialog structure
export type AlertDialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => (
  <div className={cn('flex flex-col space-y-2 mb-4', className)}>{children}</div>
);

export type AlertDialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => (
  <Heading slot="title" className={cn('font-bold text-lg', className)}>
    {children}
  </Heading>
);

export type AlertDialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => (
  <p className={cn('text-sm opacity-70', className)}>{children}</p>
);

export type AlertDialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => (
  <div className={cn('modal-action', className)}>{children}</div>
);
