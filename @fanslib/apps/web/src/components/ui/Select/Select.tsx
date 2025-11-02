import { ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { AriaSelectProps } from 'react-aria';
import { HiddenSelect, useButton, useSelect } from 'react-aria';
import type { Node } from 'react-stately';
import { useSelectState } from 'react-stately';
import { cn } from '~/lib/cn';

export type SelectProps<T extends object> = AriaSelectProps<T> & {
  className?: string;
};

export const Select = <T extends object>(props: SelectProps<T>) => {
  const state = useSelectState(props);
  const ref = useRef<HTMLButtonElement>(null);
  const { labelProps, triggerProps, valueProps, menuProps } = useSelect(
    props,
    state,
    ref
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(triggerProps, buttonRef);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (state.isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        state.close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state]);

  return (
    <div ref={containerRef} className={cn('relative', props.className)}>
      {props.label && (
        <label {...labelProps} className="label">
          <span className="label-text">{props.label}</span>
        </label>
      )}
      <HiddenSelect
        state={state}
        triggerRef={ref}
        label={props.label}
        name={props.name}
      />
      <button
        {...buttonProps}
        ref={buttonRef}
        className={cn(
          'input input-bordered w-full flex items-center justify-between focus:outline-none',
          state.isOpen && 'input-primary'
        )}
      >
        <span {...valueProps} className="flex-1 text-left truncate">
          {state.selectedItem?.rendered ?? props.placeholder ?? 'Select an option'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            state.isOpen && 'rotate-180'
          )}
        />
      </button>
      {state.isOpen && (
        <ul
          {...menuProps}
          className="bg-base-200 rounded-box shadow-lg absolute z-50 w-full mt-1 max-h-60 overflow-y-auto"
        >
          {[...state.collection].map((item, index, array) => (
            <SelectItem
              key={item.key}
              item={item}
              state={state}
              isFirst={index === 0}
              isLast={index === array.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

type SelectItemProps<T> = {
  item: Node<T>;
  state: ReturnType<typeof useSelectState>;
  isFirst?: boolean;
  isLast?: boolean;
};

const SelectItem = <T extends object>({ item, state, isFirst, isLast }: SelectItemProps<T>) => {
  const ref = useRef<HTMLLIElement>(null);
  const isSelected = state.selectedKey === item.key;
  const isDisabled = state.disabledKeys.has(item.key);

  return (
    <li
      ref={ref}
      className={cn(
        'px-4 py-2 cursor-pointer hover:bg-base-300',
        isSelected && 'bg-primary text-primary-content hover:bg-primary',
        isDisabled && 'opacity-50 cursor-not-allowed',
        isFirst && 'rounded-t-box',
        isLast && 'rounded-b-box'
      )}
      onClick={() => {
        if (!isDisabled) {
          state.setSelectedKey(item.key);
          state.close();
        }
      }}
    >
      {item.rendered}
    </li>
  );
};

