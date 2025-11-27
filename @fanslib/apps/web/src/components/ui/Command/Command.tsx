import { Command as CommandIcon, Search } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '~/lib/cn';

type CommandContextValue = {
  query: string;
  setQuery: (v: string) => void;
};

const CommandContext = createContext<CommandContextValue | null>(null);

export const Command = ({ children, className }: { children: ReactNode; className?: string }) => {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return (
    <CommandContext.Provider value={value}>
      <div className={cn('flex flex-col w-full max-w-2xl overflow-hidden rounded-xl bg-base-100 shadow-lg', className)}>
        {children}
      </div>
    </CommandContext.Provider>
  );
};

export const CommandInput = ({
  placeholder = 'Search…',
  autoFocus = true,
  value: controlledValue,
  onValueChange
}: {
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const ctx = useContext(CommandContext);
  const inputRef = useRef<HTMLInputElement>(null);
  if (!ctx) return null;

  const value = controlledValue ?? ctx.query;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    } else {
      ctx.setQuery(e.target.value);
    }
  };

  return (
    <div className="flex items-center border-b border-base-content px-3 py-2 gap-2 bg-base-100">
      <Search className="h-4 w-4 text-base-content/60" />
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-base-content/50"
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
      />
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-base-content/40 bg-base-200 px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
        <CommandIcon className="h-3 w-3" />
        K
      </kbd>
    </div>
  );
};

export const CommandEmpty = ({ children }: { children: ReactNode }) => (
  <div className="py-6 text-center text-sm text-base-content/50">{children}</div>
);

export const CommandGroup = ({ children, heading }: { children: ReactNode; heading?: ReactNode }) => (
  <div className="space-y-2">
    {heading ? <div className="px-2 py-1.5 text-xs font-semibold text-base-content/70">{heading}</div> : null}
    <ul className="space-y-1">{children}</ul>
  </div>
);

export const CommandItem = ({ value, onSelect, children, className }: { value: string; onSelect?: () => void; children: ReactElement | ReactNode; className?: string }) => {
  const ctx = useContext(CommandContext);
  const select = useCallback(() => {
    onSelect?.();
  }, [onSelect]);
  if (!ctx) return null;
  const isVisible = value.toLowerCase().includes(ctx.query.toLowerCase());
  if (!isVisible) return null;
  return (
    <li
      className={cn(
        'relative mx-0.5 flex cursor-pointer select-none items-center rounded-md pl-0 pr-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-primary/20 hover:ring-2 hover:ring-primary',
        'focus:bg-primary/20 focus:ring-2 focus:ring-primary',
        className
      )}
      onClick={select}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
        }
      }}
    >
      {children}
    </li>
  );
};

export type CommandProps = { children: ReactNode; className?: string };
export type CommandItemType = { value: string; onSelect?: () => void };
export type CommandGroupType = { heading?: ReactNode };

