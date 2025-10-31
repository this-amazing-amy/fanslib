import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AriaDialogProps } from 'react-aria';
import { FocusScope, OverlayContainer, useDialog, useModalOverlay, usePreventScroll } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';
import { cn } from '~/lib/utils';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';

export type AlertDialogProps = AriaDialogProps & {
  state: OverlayTriggerState;
  children: ReactNode;
  className?: string;
  isDismissable?: boolean;
};

export const AlertDialog = ({
  state,
  children,
  className,
  isDismissable = false,
  ...props
}: AlertDialogProps) => {
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
              'bg-base-100 rounded-lg shadow-xl p-6 w-full max-w-lg',
              'transition-all duration-200 ease-out',
              isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </FocusScope>
      </div>
    </OverlayContainer>
  );
};

export type AlertDialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => (
  <div className={cn('flex flex-col space-y-2 mb-4', className)}>{children}</div>
);

export type AlertDialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => (
  <h3 className={cn('font-bold text-lg', className)}>{children}</h3>
);

export type AlertDialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => (
  <p className={cn('text-sm opacity-70', className)}>{children}</p>
);

export type AlertDialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => (
  <div className={cn('modal-action', className)}>{children}</div>
);

export type AlertDialogActionProps = ButtonProps & {
  children: ReactNode;
};

export const AlertDialogAction = ({ children, variant = 'error', ...props }: AlertDialogActionProps) => (
  <Button variant={variant} {...props}>
    {children}
  </Button>
);

export type AlertDialogCancelProps = ButtonProps & {
  children: ReactNode;
};

export const AlertDialogCancel = ({ children, variant = 'ghost', ...props }: AlertDialogCancelProps) => (
  <Button variant={variant} {...props}>
    {children}
  </Button>
);

