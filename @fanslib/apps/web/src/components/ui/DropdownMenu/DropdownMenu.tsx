import { Check } from 'lucide-react';
import type { Key, ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AriaMenuProps } from 'react-aria';
import { DismissButton, Overlay, useMenu, useMenuItem } from 'react-aria';
import type { MenuTriggerState, TreeState } from 'react-stately';
import { useTreeState } from 'react-stately';
import { cn } from '~/lib/cn';

export type DropdownMenuProps<T extends object> = AriaMenuProps<T> & {
  state: MenuTriggerState;
  className?: string;
  triggerRef: RefObject<HTMLElement>;
};

export const DropdownMenu = <T extends object>({ state, className, triggerRef, ...props }: DropdownMenuProps<T>) => {
  const ref = useRef<HTMLUListElement>(null);
  const treeState = useTreeState(props);
  const { menuProps } = useMenu(props, treeState, ref);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return (
    <Overlay>
      <div className="fixed inset-0" onClick={() => state.close()} />
      <div
        className={cn(
          'absolute z-50 mt-2 w-56 rounded-lg bg-base-100 border border-base-300 shadow-lg p-1',
          'transition-all duration-200 ease-out',
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          className
        )}
        style={{
          position: 'absolute',
          top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + window.scrollY : 0,
          left: triggerRef.current ? triggerRef.current.getBoundingClientRect().left + window.scrollX : 0,
        }}
      >
        <DismissButton onDismiss={state.close} />
        <ul {...menuProps} ref={ref} className="outline-none">
          {[...treeState.collection].map((item) => (
            <DropdownMenuItem key={item.key} item={item} state={treeState} />
          ))}
        </ul>
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  );
};

type DropdownMenuItemProps<T> = {
  item: any;
  state: TreeState<T>;
};

const DropdownMenuItem = <T extends object>({ item, state }: DropdownMenuItemProps<T>) => {
  const ref = useRef<HTMLLIElement>(null);
  const { menuItemProps, isSelected, isFocused, isDisabled } = useMenuItem(
    { key: item.key },
    state,
    ref
  );

  return (
    <li
      {...menuItemProps}
      ref={ref}
      className={cn(
        'rounded-md px-2 py-1.5 text-sm cursor-default select-none outline-none transition-colors',
        isFocused && 'bg-base-200',
        isDisabled && 'opacity-50 pointer-events-none'
      )}
    >
      {item.rendered}
      {isSelected ? <Check className="ml-auto h-4 w-4" /> : null}
    </li>
  );
};

export type DropdownMenuItemType = {
  key: Key;
  label: ReactNode;
  onAction?: () => void;
  isDisabled?: boolean;
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

