import type { ReactNode } from 'react';
import {
  DialogTrigger,
  Popover as AriaPopover,
  Dialog,
  type DialogTriggerProps,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';
import { cn } from '~/lib/cn';

// Re-export DialogTrigger as the trigger mechanism for Popovers
export { DialogTrigger as PopoverTrigger } from 'react-aria-components';

// Styled Popover wrapper with default styling
type PopoverProps = Omit<AriaPopoverProps, 'children'> & {
  children: ReactNode;
  className?: string;
}

export const Popover = ({ children, className, offset = 4, ...props }: PopoverProps) => {
  return (
    <AriaPopover
      offset={offset}
      className={cn(
        'z-[80] overflow-hidden rounded-xl bg-base-100 border-2 border-base-content shadow-lg p-4 outline-none',
        'entering:animate-in entering:fade-in entering:zoom-in-95',
        'exiting:animate-out exiting:fade-out exiting:zoom-out-95',
        'placement-bottom:slide-in-from-top-2',
        'placement-top:slide-in-from-bottom-2',
        'placement-left:slide-in-from-right-2',
        'placement-right:slide-in-from-left-2',
        className
      )}
      {...props}
    >
      <Dialog className="outline-none">{children}</Dialog>
    </AriaPopover>
  );
};
