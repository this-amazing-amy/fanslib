import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '~/lib/cn';

type TooltipProviderContextValue = {
  delay: number;
  closeDelay: number;
};

const TooltipProviderContext = createContext<TooltipProviderContextValue>({ delay: 300, closeDelay: 100 });

export const TooltipProvider = ({ children, delay = 300, closeDelay = 100 }: { children: ReactNode; delay?: number; closeDelay?: number }) => {
  const value = useMemo(() => ({ delay, closeDelay }), [delay, closeDelay]);
  return <TooltipProviderContext.Provider value={value}>{children}</TooltipProviderContext.Provider>;
};

type TooltipContextValue = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  id: string;
  delay: number;
  closeDelay: number;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export const Tooltip = ({ children, delay, closeDelay }: { children: ReactNode; delay?: number; closeDelay?: number }) => {
  const provider = useContext(TooltipProviderContext);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const id = useMemo(() => `tooltip-${Math.random().toString(36).slice(2)}`, []);
  const value = useMemo(
    () => ({ isOpen, setOpen: setIsOpen, triggerRef, id, delay: delay ?? provider.delay, closeDelay: closeDelay ?? provider.closeDelay }),
    [isOpen, id, provider.delay, provider.closeDelay, delay, closeDelay]
  );
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
};

export const TooltipTrigger = ({ asChild: _asChild = false, children }: { asChild?: boolean; children: ReactElement }) => {
  const ctx = useContext(TooltipContext);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  if (!ctx) return null;

  const onEnter = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = window.setTimeout(() => ctx.setOpen(true), ctx.delay);
  };
  const onLeave = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => ctx.setOpen(false), ctx.closeDelay);
  };

  return (
    <span
      ref={ctx.triggerRef as React.RefObject<HTMLSpanElement>}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      aria-describedby={ctx.isOpen ? ctx.id : undefined}
      className="inline-flex"
    >
      {children}
    </span>
  );
};

export const TooltipContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ctx = useContext(TooltipContext);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!ctx) return;
    if (ctx.isOpen) setTimeout(() => setIsAnimating(true), 10);
    else setIsAnimating(false);
  }, [ctx]);

  if (!ctx?.isOpen) return null;

  const rect = ctx.triggerRef.current?.getBoundingClientRect();
  const top = rect ? rect.bottom + window.scrollY + 8 : 0;
  const left = rect ? rect.left + window.scrollX + rect.width / 2 : 0;

  return (
    <div
      id={ctx.id}
      role="tooltip"
      style={{ position: 'absolute', top, left, transform: 'translateX(-50%)' }}
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

export type TooltipProps = { children: ReactNode; delay?: number; closeDelay?: number };
export type TooltipTriggerProps = { children: ReactElement; asChild?: boolean };
export type TooltipContentProps = { children: ReactNode; className?: string };