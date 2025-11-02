import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AriaPopoverProps, Placement } from 'react-aria';
import { DismissButton, Overlay, usePopover } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';
import { cn } from '~/lib/cn';

export type PopoverProps = Omit<AriaPopoverProps, 'popoverRef'> & {
  state: OverlayTriggerState;
  children: ReactNode;
  className?: string;
  placement?: Placement;
  triggerRef: RefObject<HTMLElement>;
};

export const Popover = ({ state, children, className, placement = 'bottom', triggerRef, ...props }: PopoverProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { popoverProps, underlayProps } = usePopover(
    {
      ...props,
      offset: props.offset ?? 8,
      placement,
      popoverRef: ref,
      triggerRef,
    },
    state
  );

  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return (
    <Overlay>
      <div {...underlayProps} className="fixed inset-0" onClick={() => state.close()} />
      <div
        {...popoverProps}
        ref={ref}
        className={cn(
          'z-50 w-72 rounded-lg bg-base-100 border border-base-300 shadow-lg p-4',
          'transition-opacity duration-150 ease-out',
          isAnimating ? 'opacity-100' : 'opacity-0',
          className
        )}
      >
        <DismissButton onDismiss={state.close} />
        {children}
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  );
};

