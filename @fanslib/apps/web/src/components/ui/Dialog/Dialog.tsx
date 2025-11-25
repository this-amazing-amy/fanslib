import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Modal,
  Dialog as AriaDialog,
  Heading,
  type ModalOverlayProps,
  type DialogProps as AriaDialogProps,
} from 'react-aria-components';
import { cn } from '~/lib/cn';
import { Button } from '../Button';

// Re-export DialogTrigger from React Aria
export { DialogTrigger } from 'react-aria-components';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

// Modal component with styled overlay
type ModalProps = Omit<ModalOverlayProps, 'children'> & {
  children: ReactNode;
  className?: string;
}

export const DialogModal = ({ children, className, isDismissable = true, ...props }: ModalProps) => <Modal
      isDismissable={isDismissable}
      className={cn(
        'fixed inset-0 z-[70] bg-black/50',
        'entering:animate-in entering:fade-in',
        'exiting:animate-out exiting:fade-out',
        className
      )}
      {...props}
    >
      {children}
    </Modal>;

// Dialog component wrapper with content styling
type DialogProps = Omit<AriaDialogProps, 'children'> & {
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showCloseButton?: boolean;
}

export const Dialog = ({ children, className, maxWidth = 'lg', showCloseButton = true, ...props }: DialogProps) => <AriaDialog
      className={cn(
        'fixed left-[50%] top-[50%] z-[71] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-base-content bg-base-100 p-6 shadow-xl rounded-lg outline-none',
        maxWidthClasses[maxWidth],
        'entering:animate-in entering:fade-in entering:zoom-in-95',
        'entering:slide-in-from-left-1/2 entering:slide-in-from-top-[48%]',
        'exiting:animate-out exiting:fade-out exiting:zoom-out-95',
        'exiting:slide-out-to-left-1/2 exiting:slide-out-to-top-[48%]',
        className
      )}
      {...props}
    >
      {({ close }) => (
        <>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="xs"
              aria-label="Close"
              className="btn-circle absolute right-2 top-2"
              onPress={close}
            >
              <X className="h-6 w-6" />
            </Button>
          )}
          {typeof children === 'function' ? children({ close }) : children}
        </>
      )}
    </AriaDialog>;

// Helper components for Dialog structure
export type DialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const DialogHeader = ({ children, className }: DialogHeaderProps) => (
  <div className={cn('flex flex-col space-y-1.5 mb-4', className)}>{children}</div>
);

export type DialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export const DialogTitle = ({ children, className }: DialogTitleProps) => (
  <Heading slot="title" className={cn('font-bold text-lg', className)}>
    {children}
  </Heading>
);

export type DialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const DialogDescription = ({ children, className }: DialogDescriptionProps) => (
  <p className={cn('text-sm opacity-70', className)}>{children}</p>
);

export type DialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export const DialogFooter = ({ children, className }: DialogFooterProps) => (
  <div className={cn('modal-action', className)}>{children}</div>
);

export type DialogBodyProps = {
  children: ReactNode;
  className?: string;
};

export const DialogBody = ({ children, className }: DialogBodyProps) => (
  <div className={cn('py-4', className)}>{children}</div>
);
