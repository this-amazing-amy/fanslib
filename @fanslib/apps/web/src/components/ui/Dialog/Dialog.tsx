import { X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FocusScope, usePreventScroll } from 'react-aria';
import { cn } from '~/lib/cn';
import { Button } from '../Button';

export type DialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

type DialogContextValue = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setOpen = useCallback((v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  }, [isControlled, onOpenChange]);
  const toggle = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);
  const value = useMemo(() => ({ isOpen, setOpen, toggle }), [isOpen, setOpen, toggle]);
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
};

export const DialogTrigger = ({ asChild = false, children }: { asChild?: boolean; children: ReactElement }) => {
  const ctx = useContext(DialogContext);
  if (!ctx) return null;
  const { toggle, isOpen } = ctx;
  if (asChild) {
    return (
      <span onClick={toggle} aria-haspopup="dialog" aria-expanded={isOpen} className="inline-flex">
        {children}
      </span>
    );
  }
  return <button onClick={toggle} aria-haspopup="dialog" aria-expanded={isOpen} />;
};

export const DialogContent = ({
  children,
  className,
  isDismissable = true,
  maxWidth = 'lg',
}: {
  children: ReactNode;
  className?: string;
  isDismissable?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}) => {
  const ctx = useContext(DialogContext);
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
          role="dialog"
          aria-modal="true"
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
              onClick={() => ctx.setOpen(false)}
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

