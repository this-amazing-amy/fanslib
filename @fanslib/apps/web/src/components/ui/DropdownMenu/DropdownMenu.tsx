import type { ReactNode } from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  Popover,
  Separator,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';
import { cn } from '~/lib/cn';

// Re-export MenuTrigger from React Aria
export { MenuTrigger as DropdownMenuTrigger } from 'react-aria-components';

// Styled Popover for Menu
type DropdownMenuPopoverProps = Omit<AriaPopoverProps, 'children'> & {
  children: ReactNode;
  className?: string;
}

export const DropdownMenuPopover = ({ children, className, offset = 4, ...props }: DropdownMenuPopoverProps) => (
  <Popover
    offset={offset}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-xl bg-base-100 border-2 border-base-content shadow-lg p-1',
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
    {children}
  </Popover>
);

// Styled Menu wrapper
type MenuProps = Omit<AriaMenuProps<object>, 'children'> & {
  children: ReactNode;
  className?: string;
}

export const DropdownMenu = ({ children, className, ...props }: MenuProps) => <AriaMenu className={cn('outline-none', className)} {...props}>
      {children}
    </AriaMenu>;

// Styled MenuItem wrapper
type MenuItemProps = AriaMenuItemProps & {
  children: ReactNode;
  className?: string;
}

export const DropdownMenuItem = ({ children, className, ...props }: MenuItemProps) => <AriaMenuItem
      className={cn(
        'rounded-md px-2 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors',
        'focus:bg-primary/20 focus:ring-2 focus:ring-primary',
        'hover:bg-primary/20 hover:ring-2 hover:ring-primary',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </AriaMenuItem>;

// Separator component
export type DropdownMenuSeparatorProps = {
  className?: string;
};

export const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => (
  <Separator className={cn('my-1 h-px bg-base-content/20', className)} />
);

// Label component (for section headers)
export type DropdownMenuLabelProps = {
  children: ReactNode;
  className?: string;
};

export const DropdownMenuLabel = ({ children, className }: DropdownMenuLabelProps) => (
  <div className={cn('px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase', className)}>{children}</div>
);
