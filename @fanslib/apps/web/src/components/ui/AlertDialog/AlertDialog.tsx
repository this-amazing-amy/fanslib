import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import type { ReactElement, ReactNode } from 'react';
import * as React from 'react';
import { cn } from '~/lib/cn';
import type { ButtonProps } from '../Button';
import { Button } from '../Button';

export type AlertDialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const AlertDialog = AlertDialogPrimitive.Root;

export const AlertDialogTrigger = ({ children, asChild = true }: { children: ReactElement; asChild?: boolean }) => (
  <AlertDialogPrimitive.Trigger asChild={asChild}>{children}</AlertDialogPrimitive.Trigger>
);

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

export const AlertDialogContent = ({
  children,
  className,
  isDismissable = false,
}: {
  children: ReactNode;
  className?: string;
  isDismissable?: boolean;
}) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-base-100 p-6 shadow-xl duration-200',
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
        }
      }}
      onInteractOutside={(e) => {
        if (!isDismissable) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
);

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
  <AlertDialogPrimitive.Title className={cn('font-bold text-lg', className)}>{children}</AlertDialogPrimitive.Title>
);

export type AlertDialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => (
  <AlertDialogPrimitive.Description className={cn('text-sm opacity-70', className)}>
    {children}
  </AlertDialogPrimitive.Description>
);

export type AlertDialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => (
  <div className={cn('modal-action', className)}>{children}</div>
);

export type AlertDialogActionProps = ButtonProps & {
  children: ReactNode;
};

export const AlertDialogAction = ({
  children,
  variant = 'error',
  onClick,
  ...props
}: AlertDialogActionProps & { onClick?: () => void }) => (
  <AlertDialogPrimitive.Action asChild>
    <Button variant={variant} {...props} onClick={onClick}>
      {children}
    </Button>
  </AlertDialogPrimitive.Action>
);

export type AlertDialogCancelProps = ButtonProps & {
  children: ReactNode;
};

export const AlertDialogCancel = ({
  children,
  variant = 'ghost',
  onClick,
  ...props
}: AlertDialogCancelProps & { onClick?: () => void }) => (
  <AlertDialogPrimitive.Cancel asChild>
    <Button variant={variant} {...props} onClick={onClick}>
      {children}
    </Button>
  </AlertDialogPrimitive.Cancel>
);
