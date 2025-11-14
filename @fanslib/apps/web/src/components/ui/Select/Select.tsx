import * as SelectPrimitive from '@radix-ui/react-select';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '~/lib/cn';

export const Select = SelectPrimitive.Root;

export const SelectTrigger = ({ asChild = false, children, className }: { asChild?: boolean; children: ReactElement; className?: string }) => {
  if (asChild) {
    return <SelectPrimitive.Trigger asChild className={className}>{children}</SelectPrimitive.Trigger>;
  }
  return (
    <SelectPrimitive.Trigger className={cn('input input-bordered w-full flex items-center justify-between focus:outline-none', className)}>
      {children}
    </SelectPrimitive.Trigger>
  );
};

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = ({ children, className, align = 'start' }: { children: ReactNode; className?: string; align?: 'start' | 'end' }) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'bg-base-100 rounded-xl border-2 border-base-content shadow-lg z-50 max-h-60 overflow-y-auto',
          className
        )}
        position="popper"
        align={align}
        sideOffset={4}
      >
        <SelectPrimitive.Viewport>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
};

export const SelectItem = ({ value, children, className, onSelect }: { value: string; children: ReactNode; className?: string; onSelect?: () => void }) => {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'px-4 py-2 cursor-pointer hover:bg-primary/20 hover:ring-2 hover:ring-primary outline-none',
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-content data-[state=checked]:hover:bg-primary',
        className
      )}
      onSelect={onSelect}
    >
      {children}
    </SelectPrimitive.Item>
  );
};

