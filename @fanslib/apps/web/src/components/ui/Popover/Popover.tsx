import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '~/lib/cn';

type PopoverContextValue = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

export const Popover = ({ children, open, onOpenChange }: { children: ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setOpen = useCallback((v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  }, [isControlled, onOpenChange]);
  const toggle = useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);
  const triggerRef = useRef<HTMLElement | null>(null);

  const value = useMemo(() => ({ isOpen, setOpen, toggle, triggerRef }), [isOpen, setOpen, toggle]);
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};

export const PopoverTrigger = ({ asChild = false, children }: { asChild?: boolean; children: ReactElement }) => {
  const ctx = useContext(PopoverContext);
  if (!ctx) return null;
  const { toggle, triggerRef, isOpen } = ctx;
  if (asChild) {
    return (
      <span
        ref={triggerRef as React.RefObject<HTMLSpanElement>}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="inline-flex"
      >
        {children}
      </span>
    );
  }
  return (
    <button ref={triggerRef as React.RefObject<HTMLButtonElement>} onClick={toggle} aria-haspopup="dialog" aria-expanded={isOpen} />
  );
};

export const PopoverContent = ({
  children,
  className,
  align = 'start',
  side = 'bottom',
}: {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}) => {
  const ctx = useContext(PopoverContext);
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
      ctx.setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [ctx]);

  if (!ctx?.isOpen) return null;

  const rect = ctx.triggerRef.current?.getBoundingClientRect();
  const triggerTop = rect ? rect.top + window.scrollY : 0;
  const triggerBottom = rect ? rect.bottom + window.scrollY : 0;
  const triggerLeft = rect ? rect.left + window.scrollX : 0;
  const triggerRight = rect ? rect.right + window.scrollX : 0;

  const top = side === 'top' ? triggerTop : side === 'bottom' ? triggerBottom : triggerTop;
  const leftBase = align === 'end' ? Math.max(0, triggerRight - 288) : triggerLeft; // 288px default width fallback

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onClick={() => ctx.setOpen(false)} />
      <div
        className={cn(
          'absolute mt-2 rounded-lg bg-base-100 border border-base-300 shadow-lg p-4',
          'transition-opacity duration-150 ease-out',
          isAnimating ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{ top, left: leftBase }}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
};

