import type { ReactElement, ReactNode } from 'react';
import { cloneElement, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '~/lib/cn';

type DropdownMenuContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

export const DropdownMenu = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, triggerRef }),
    [isOpen, open, close, toggle]
  );

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
};

export const DropdownMenuTrigger = ({ children }: { children: ReactElement }) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) return null;

  const { toggle, triggerRef } = ctx;

  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void; ref?: React.Ref<HTMLElement> };
  return cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof childProps.ref === 'function') {
        childProps.ref(node);
      } else if (childProps.ref) {
        (childProps.ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onClick: (e: React.MouseEvent) => {
      childProps.onClick?.(e);
      if (!e.defaultPrevented) {
        toggle();
      }
    },
    'aria-haspopup': 'menu',
    'aria-expanded': ctx.isOpen,
  } as Partial<unknown>);
};

export const DropdownMenuContent = ({
  children,
  className,
  align = 'start',
}: {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
}) => {
  const ctx = useContext(DropdownMenuContext);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!ctx) return;
    if (ctx.isOpen) setTimeout(() => setIsAnimating(true), 10);
    else setIsAnimating(false);
  }, [ctx]);

  useEffect(() => {
    if (!ctx?.isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ctx.triggerRef.current?.contains(target as Node)) return;
      ctx.close();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [ctx]);

  if (!ctx?.isOpen) return null;

  const rect = ctx.triggerRef.current?.getBoundingClientRect();
  const top = rect ? rect.bottom + window.scrollY : 0;
  const leftBase = rect ? rect.left + window.scrollX : 0;
  const rightBase = rect ? rect.right + window.scrollX : 0;
  const left = align === 'end' ? Math.max(0, rightBase - 224) : leftBase; // 224px default width fallback

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onClick={ctx.close} />
      <div
        className={cn(
          'absolute mt-2 rounded-lg bg-base-100 border border-base-300 shadow-lg p-1',
          'transition-all duration-200 ease-out origin-top',
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          className
        )}
        style={{ top, left }}
        role="menu"
      >
        {children}
      </div>
    </div>
  );
};



export const DropdownMenuItem = ({
  children,
  className,
  onClick,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const ctx = useContext(DropdownMenuContext);
  const onSelect = () => {
    if (disabled) return;
    onClick?.();
    ctx?.close();
  };
  return (
    <div
      onClick={onSelect}
      role="menuitem"
      aria-disabled={disabled}
      className={cn(
        'rounded-md px-2 py-1.5 text-sm cursor-default select-none outline-none transition-colors',
        disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-base-200',
        className
      )}
    >
      {children}
    </div>
  );
};

export type DropdownMenuSeparatorProps = {
  className?: string;
};

export const DropdownMenuSeparator = ({ className }: DropdownMenuSeparatorProps) => (
  <div className={cn('divider my-1', className)} />
);

export type DropdownMenuLabelProps = {
  children: ReactNode;
  className?: string;
};

export const DropdownMenuLabel = ({ children, className }: DropdownMenuLabelProps) => (
  <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>{children}</div>
);