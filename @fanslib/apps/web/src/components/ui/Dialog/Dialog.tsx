import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AriaDialogProps } from 'react-aria';
import { FocusScope, OverlayContainer, useDialog, useModalOverlay, usePreventScroll } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';
import { cn } from '~/lib/cn';
import { Button } from '../Button';

export type DialogProps = AriaDialogProps & {
  state: OverlayTriggerState;
  children: ReactNode;
  className?: string;
  isDismissable?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Dialog = ({
  state,
  children,
  className,
  isDismissable = true,
  maxWidth = 'lg',
  ...props
}: DialogProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { modalProps, underlayProps } = useModalOverlay({ isDismissable }, state, ref);
  const { dialogProps } = useDialog(props, ref);
  const [isAnimating, setIsAnimating] = useState(false);

  usePreventScroll();

  useEffect(() => {
    if (state.isOpen) {
      setIsAnimating(true);
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return (
    <OverlayContainer>
      <div 
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
          'transition-opacity duration-200 ease-out',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        {...underlayProps}
        onClick={(e) => {
          if (isDismissable && e.target === e.currentTarget) {
            state.close();
          }
        }}
      >
        <FocusScope contain restoreFocus autoFocus>
          <div
            {...modalProps}
            {...dialogProps}
            ref={ref}
            className={cn(
              'bg-base-100 rounded-lg shadow-xl p-6 w-full',
              'transition-all duration-200 ease-out',
              isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
              maxWidthClasses[maxWidth],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {isDismissable ? (
              <Button
                variant="ghost"
                size="xs"
                onPress={() => state.close()}
                aria-label="Close"
                className="btn-circle absolute right-2 top-2"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
            {children}
          </div>
        </FocusScope>
      </div>
    </OverlayContainer>
  );
};

export type DialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const DialogHeader = ({ children, className }: DialogHeaderProps) => (
  <div className={cn('flex flex-col space-y-1.5 mb-4', className)}>{children}</div>
);

export type DialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export const DialogTitle = ({ children, className }: DialogTitleProps) => (
  <h3 className={cn('font-bold text-lg', className)}>{children}</h3>
);

export type DialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const DialogDescription = ({ children, className }: DialogDescriptionProps) => (
  <p className={cn('text-sm opacity-70', className)}>{children}</p>
);

export type DialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export const DialogFooter = ({ children, className }: DialogFooterProps) => (
  <div className={cn('modal-action', className)}>{children}</div>
);

export type DialogBodyProps = {
  children: ReactNode;
  className?: string;
};

export const DialogBody = ({ children, className }: DialogBodyProps) => (
  <div className={cn('py-4', className)}>{children}</div>
);

