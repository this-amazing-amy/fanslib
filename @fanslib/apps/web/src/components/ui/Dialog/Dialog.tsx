import { X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '~/lib/cn';
import { Button } from '../Button';

export type DialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = ({ children, asChild = true }: { children: ReactElement; asChild?: boolean }) => (
  <DialogPrimitive.Trigger asChild={asChild}>{children}</DialogPrimitive.Trigger>
);

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[70] bg-black/50',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = ({
  children,
  className,
  isDismissable = true,
  maxWidth = 'lg',
}: {
  children: ReactNode;
  className?: string;
  isDismissable?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed left-[50%] top-[50%] z-[70] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border-2 border-base-content bg-base-100 p-6 shadow-xl duration-200',
        maxWidthClasses[maxWidth],
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'rounded-lg',
        className
      )}
      onEscapeKeyDown={(e) => {
        if (!isDismissable) {
          e.preventDefault();
        }
      }}
      onPointerDownOutside={(e) => {
        if (!isDismissable) {
          e.preventDefault();
          return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('[data-radix-popper-content-wrapper]') || target.closest('[data-radix-popover-content]')) {
          e.preventDefault();
        }
      }}
      onInteractOutside={(e) => {
        if (!isDismissable) {
          e.preventDefault();
          return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('[data-radix-popper-content-wrapper]') || target.closest('[data-radix-popover-content]')) {
          e.preventDefault();
        }
      }}
    >
      {isDismissable ? (
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="xs"
            aria-label="Close"
            className="btn-circle absolute right-2 top-2"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogPrimitive.Close>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

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
  <DialogPrimitive.Title className={cn('font-bold text-lg', className)}>{children}</DialogPrimitive.Title>
);

export type DialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const DialogDescription = ({ children, className }: DialogDescriptionProps) => (
  <DialogPrimitive.Description className={cn('text-sm opacity-70', className)}>{children}</DialogPrimitive.Description>
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

export const DialogClose = DialogPrimitive.Close;
