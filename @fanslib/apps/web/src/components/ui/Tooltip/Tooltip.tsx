import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AriaTooltipProps } from 'react-aria';
import { mergeProps, useTooltip } from 'react-aria';
import type { TooltipTriggerState } from 'react-stately';
import { cn } from '~/lib/cn';

export type TooltipProps = AriaTooltipProps & {
  state: TooltipTriggerState;
  children: ReactNode;
  className?: string;
};

export const Tooltip = ({ state, children, className, ...props }: TooltipProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { tooltipProps } = useTooltip(props, state);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return (
    <div
      {...mergeProps(tooltipProps)}
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
      }}
      className={cn(
        'z-50 px-3 py-1.5 text-xs rounded-md bg-base-200 border border-base-300 shadow-md whitespace-nowrap',
        'transition-opacity duration-150 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};

export type TooltipTriggerProps = {
  children: ReactNode;
  tooltip: ReactNode;
  delay?: number;
  closeDelay?: number;
  className?: string;
};

