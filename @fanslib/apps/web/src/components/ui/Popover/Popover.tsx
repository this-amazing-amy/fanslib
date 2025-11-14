import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '~/lib/cn';

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = ({ children, asChild = true }: { children: ReactElement; asChild?: boolean }) => (
  <PopoverPrimitive.Trigger asChild={asChild}>{children}</PopoverPrimitive.Trigger>
);

export const PopoverContent = ({
  children,
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
}: {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      side={side}
      sideOffset={sideOffset}
      data-radix-popover-content="true"
      className={cn(
        'z-[80] rounded-lg bg-base-100 border border-base-300 shadow-lg p-4 outline-none',
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
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
);
