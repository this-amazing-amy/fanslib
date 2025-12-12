import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset as floatingOffset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
  type Placement,
} from '@floating-ui/react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { cloneElement, useId, useMemo, useState } from 'react';
import { cn } from '~/lib/cn';

type TooltipProps = {
  children: ReactElement;
  content: ReactNode;
  placement?: Placement;
  offset?: number;
  openDelayMs?: number;
  className?: string;
  variant?: 'default' | 'naked';
};

export const Tooltip = ({
  children,
  content,
  placement = 'top',
  offset = 4,
  openDelayMs = 0,
  className,
  variant = 'default',
}: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [floatingOffset(offset), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    move: false,
    delay: { open: openDelayMs, close: 0 },
    handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const childProps = children.props as Record<string, unknown>;
  const existingRef = (children as ReactElement & { ref?: Ref<unknown> }).ref;
  const referenceRef = useMergeRefs([refs.setReference, existingRef]);

  const referenceProps = useMemo(
    () =>
      getReferenceProps({
        'aria-describedby': isOpen ? tooltipId : undefined,
        ...childProps,
      }),
    [childProps, getReferenceProps, isOpen, tooltipId]
  );

  const floatingProps = useMemo(
    () =>
      getFloatingProps({
        id: tooltipId,
      }),
    [getFloatingProps, tooltipId]
  );

  return (
    <>
      {cloneElement(children, { ...referenceProps, ref: referenceRef } as Record<string, unknown>)}
      {isOpen ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              variant === 'default' ? 'z-50 px-3 py-1.5 text-xs rounded-md bg-base-100 border border-base-content shadow-lg' : '',
              variant === 'naked' ? 'z-50 rounded-full bg-base-100 border border-base-content shadow-lg' : '',
              className
            )}
            {...floatingProps}
          >
            {content}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
};