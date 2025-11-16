import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '~/lib/cn';

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = TooltipPrimitive.Root;

export const TooltipTrigger = ({ children, asChild = true }: { children: ReactElement; asChild?: boolean }) => (
  <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>
);

export const TooltipContent = ({
  children,
  className,
  side = 'top',
  sideOffset = 4,
}: {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      side={side}
      sideOffset={sideOffset}
      className={cn(
        'z-50 px-3 py-1.5 text-xs rounded-md bg-base-100 border border-base-content shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
);