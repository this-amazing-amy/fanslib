import type { ReactNode } from 'react';
import {
  TooltipTrigger as AriaTooltipTrigger,
  Tooltip as AriaTooltip,
  Button,
  type TooltipTriggerComponentProps,
  type TooltipProps as AriaTooltipProps,
} from 'react-aria-components';
import { cn } from '~/lib/cn';

// Re-export TooltipTrigger directly from React Aria
export { TooltipTrigger } from 'react-aria-components';

// Styled Tooltip wrapper with default styling
type TooltipProps = Omit<AriaTooltipProps, 'children'> & {
  children: ReactNode;
  className?: string;
}

export const Tooltip = ({ children, className, offset = 4, ...props }: TooltipProps) => {
  return (
    <AriaTooltip
      offset={offset}
      className={cn(
        'z-50 px-3 py-1.5 text-xs rounded-md bg-base-100 border border-base-content shadow-lg',
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
    </AriaTooltip>
  );
};