import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AriaDialogProps } from 'react-aria';
import { FocusScope, OverlayContainer, useDialog, useModalOverlay, usePreventScroll } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';
import { X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '../Button';

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

export type SheetProps = AriaDialogProps & {
  state: OverlayTriggerState;
  children: ReactNode;
  className?: string;
  isDismissable?: boolean;
  side?: SheetSide;
};

const sideClasses: Record<SheetSide, string> = {
  top: 'top-0 left-0 right-0 h-auto max-h-[80vh] w-full',
  right: 'top-0 right-0 bottom-0 h-full w-3/4 sm:max-w-sm',
  bottom: 'bottom-0 left-0 right-0 h-auto max-h-[80vh] w-full',
  left: 'top-0 left-0 bottom-0 h-full w-3/4 sm:max-w-sm',
};

export const Sheet = ({
  state,
  children,
  className,
  isDismissable = true,
  side = 'right',
  ...props
}: SheetProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { modalProps, underlayProps } = useModalOverlay({ isDismissable }, state, ref);
  const { dialogProps } = useDialog(props, ref);
  const [isAnimating, setIsAnimating] = useState(false);

  usePreventScroll();

  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  const getTranslateClass = () => {
    if (!isAnimating) {
      switch (side) {
        case 'right':
          return 'translate-x-full';
        case 'left':
          return '-translate-x-full';
        case 'top':
          return '-translate-y-full';
        case 'bottom':
          return 'translate-y-full';
      }
    }
    return 'translate-x-0 translate-y-0';
  };

  return (
    <OverlayContainer>
      <div className="fixed inset-0 z-50">
        <div
          className={cn(
            'fixed inset-0 bg-black/50',
            'transition-opacity duration-200 ease-out',
            isAnimating ? 'opacity-100' : 'opacity-0'
          )}
          {...underlayProps}
          onClick={() => isDismissable && state.close()}
        />
        <FocusScope contain restoreFocus autoFocus>
          <div
            {...modalProps}
            {...dialogProps}
            ref={ref}
            className={cn(
              'fixed bg-base-100 p-6 shadow-lg z-50 overflow-y-auto',
              'transition-transform duration-300 ease-out',
              getTranslateClass(),
              sideClasses[side],
              className
            )}
          >
            {isDismissable ? (
              <div className="absolute right-4 top-4 z-10">
                <Button
                  variant="ghost"
                  size="xs"
                  onPress={() => state.close()}
                  aria-label="Close"
                  className="btn-circle"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            {children}
          </div>
        </FocusScope>
      </div>
    </OverlayContainer>
  );
};

export type SheetHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const SheetHeader = ({ children, className }: SheetHeaderProps) => (
  <div className={cn('flex flex-col space-y-2 mb-4', className)}>{children}</div>
);

export type SheetTitleProps = {
  children: ReactNode;
  className?: string;
};

export const SheetTitle = ({ children, className }: SheetTitleProps) => (
  <h3 className={cn('font-bold text-lg', className)}>{children}</h3>
);

export type SheetDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const SheetDescription = ({ children, className }: SheetDescriptionProps) => (
  <p className={cn('text-sm opacity-70', className)}>{children}</p>
);

export type SheetFooterProps = {
  children: ReactNode;
  className?: string;
};

export const SheetFooter = ({ children, className }: SheetFooterProps) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)}>
    {children}
  </div>
);

