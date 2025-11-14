import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ReactElement, ReactNode } from 'react';
import * as React from 'react';
import { cn } from '~/lib/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = ({ children, asChild = true }: { children: ReactElement; asChild?: boolean }) => (
  <DropdownMenuPrimitive.Trigger asChild={asChild}>{children}</DropdownMenuPrimitive.Trigger>
);

export const DropdownMenuContent = ({
  children,
  className,
  align = 'start',
  sideOffset = 4,
}: {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
}) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-xl bg-base-100 border-2 border-base-content shadow-lg p-1',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
    >
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
);

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    onClick?: () => void;
    disabled?: boolean;
  }
>(({ className, onClick, disabled, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    disabled={disabled}
    onSelect={(e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.();
    }}
    className={cn(
      'rounded-md px-2 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors',
      'focus:bg-primary/20 focus:ring-2 focus:ring-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-primary/20 hover:ring-2 hover:ring-primary',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export type DropdownMenuSeparatorProps = {
  className?: string;
};

export const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => (
  <DropdownMenuPrimitive.Separator className={cn('hidden', className)} />
);

export type DropdownMenuLabelProps = {
  children: ReactNode;
  className?: string;
};

export const DropdownMenuLabel = ({ children, className }: DropdownMenuLabelProps) => (
  <DropdownMenuPrimitive.Label className={cn('px-2 py-1.5 text-base font-semibold', className)}>
    {children}
  </DropdownMenuPrimitive.Label>
);
