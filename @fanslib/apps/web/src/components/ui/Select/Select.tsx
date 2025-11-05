import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '~/lib/cn';

type SelectContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  value?: string;
  setValue: (v: string) => void;
  placeholder?: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  selectedLabel?: string;
  setSelectedLabel: (v?: string) => void;
};

const SelectContext = createContext<SelectContextValue | null>(null);

export const Select = ({ children, value, defaultValue, onValueChange, placeholder, isDisabled }: { children: ReactNode; value?: string; defaultValue?: string; onValueChange?: (v: string) => void; placeholder?: string; isDisabled?: boolean }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(undefined);

  const isControlled = typeof value !== 'undefined';
  const currentValue = isControlled ? value : internalValue;

  const setValue = useCallback((v: string) => {
    onValueChange?.(v);
    if (!isControlled) setInternalValue(v);
  }, [isControlled, onValueChange]);

  const triggerRef = useRef<HTMLElement | null>(null);

  const ctx = useMemo(() => ({
    open: internalOpen,
    setOpen: setInternalOpen,
    value: currentValue,
    setValue,
    placeholder,
    triggerRef,
    selectedLabel,
    setSelectedLabel,
    isDisabled,
  }), [internalOpen, currentValue, setValue, placeholder, selectedLabel, isDisabled]);

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
};

export const SelectTrigger = ({ asChild = false, children, className }: { asChild?: boolean; children: ReactElement; className?: string }) => {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const toggle = () => ctx.setOpen(!ctx.open);
  if (asChild) {
    return (
      <span
        ref={ctx.triggerRef as React.RefObject<HTMLSpanElement>}
        onClick={toggle}
        className={cn('inline-flex w-full', className)}
        aria-expanded={ctx.open}
      >
        {children}
      </span>
    );
  }
  return (
    <button ref={ctx.triggerRef as React.RefObject<HTMLButtonElement>} onClick={toggle} aria-expanded={ctx.open} className={cn('input input-bordered w-full flex items-center justify-between focus:outline-none', className)} />
  );
};

export const SelectValue = ({ placeholder: ph }: { placeholder?: string }) => {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return <span className="flex-1 text-left truncate">{ctx.selectedLabel ?? ctx.placeholder ?? ph ?? 'Select an option'}</span>;
};

export const SelectContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  const ctx = useContext(SelectContext);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  useEffect(() => {
    if (!ctx?.open) return;
    const rect = ctx.triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ctx.triggerRef.current?.contains(target)) return;
      ctx.setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [ctx?.open]);
  if (!ctx?.open || !position) return null;
  return (
    <ul
      className={cn('bg-base-200 rounded-box shadow-lg absolute z-50 mt-1 max-h-60 overflow-y-auto', className)}
      style={{ top: position.top, left: position.left, width: position.width }}
      role="listbox"
    >
      {children}
    </ul>
  );
};

export const SelectItem = ({ value, children, className, onSelect }: { value: string; children: ReactNode; className?: string; onSelect?: () => void }) => {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const isSelected = ctx.value === value;
  const select = () => {
    ctx.setValue(value);
    ctx.setSelectedLabel(typeof children === 'string' ? children : undefined);
    onSelect?.();
    ctx.setOpen(false);
  };
  return (
    <li
      onClick={select}
      className={cn(
        'px-4 py-2 cursor-pointer hover:bg-base-300',
        isSelected && 'bg-primary text-primary-content hover:bg-primary',
        className
      )}
      role="option"
      aria-selected={isSelected}
    >
      {children}
    </li>
  );
};

