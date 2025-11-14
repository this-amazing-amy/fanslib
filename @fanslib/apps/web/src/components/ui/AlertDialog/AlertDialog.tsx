import type { ReactElement, ReactNode } from 'react';
import { cloneElement, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FocusScope, usePreventScroll } from 'react-aria';
import { cn } from '~/lib/cn';
import type { ButtonProps } from '../Button';
import { Button } from '../Button';

export type AlertDialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type AlertDialogContextValue = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

export const AlertDialog = ({ children, open, onOpenChange }: AlertDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setOpen = useCallback((v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  }, [isControlled, onOpenChange]);
  const toggle = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);
  const value = useMemo(() => ({ isOpen, setOpen, toggle }), [isOpen, setOpen, toggle]);
  return <AlertDialogContext.Provider value={value}>{children}</AlertDialogContext.Provider>;
};

export const AlertDialogTrigger = ({ children }: { children: ReactElement }) => {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) return null;

  const { toggle, isOpen } = ctx;

  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
  return cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      childProps.onClick?.(e);
      if (!e.defaultPrevented) {
        toggle();
      }
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,
  } as Partial<unknown>);
};

export const AlertDialogContent = ({ children, className, isDismissable = false }: { children: ReactNode; className?: string; isDismissable?: boolean }) => {
  const ctx = useContext(AlertDialogContext);
  const ref = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  usePreventScroll();

  useEffect(() => {
    if (!ctx) return;
    if (ctx.isOpen) setIsAnimating(true);
  }, [ctx]);

  useEffect(() => {
    if (!ctx?.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDismissable) ctx.setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ctx, isDismissable]);

  if (!ctx?.isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
        'transition-opacity duration-200 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
      onClick={(e) => {
        if (isDismissable && e.target === e.currentTarget) ctx.setOpen(false);
      }}
    >
      <FocusScope contain restoreFocus autoFocus>
        <div
          ref={ref}
          role="alertdialog"
          aria-modal="true"
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

export const AlertDialogAction = ({ children, variant = 'error', onClick, ...props }: AlertDialogActionProps & { onClick?: () => void }) => {
  const ctx = useContext(AlertDialogContext);
  const click = () => {
    onClick?.();
    ctx?.setOpen(false);
  };
  return (
    <Button variant={variant} {...props} onClick={click}>
      {children}
    </Button>
  );
};

export type AlertDialogCancelProps = ButtonProps & {
  children: ReactNode;
};

export const AlertDialogCancel = ({ children, variant = 'ghost', onClick, ...props }: AlertDialogCancelProps & { onClick?: () => void }) => {
  const ctx = useContext(AlertDialogContext);
  const click = () => {
    onClick?.();
    ctx?.setOpen(false);
  };
  return (
    <Button variant={variant} {...props} onClick={click}>
      {children}
    </Button>
  );
};

