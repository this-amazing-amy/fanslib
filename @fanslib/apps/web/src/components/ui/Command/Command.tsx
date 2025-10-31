import type { ReactNode, Key } from 'react';
import { useRef, useMemo } from 'react';
import type { AriaComboBoxProps } from 'react-aria';
import { useComboBox, useFilter, useButton } from 'react-aria';
import { useComboBoxState } from 'react-stately';
import type { Node } from 'react-stately';
import { Item, Section } from 'react-stately';
import { useListBox, useOption } from 'react-aria';
import { Search, Command as CommandIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

export type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  keywords?: string[];
  onSelect?: () => void;
};

export type CommandGroup = {
  id: string;
  label: string;
  items: CommandItem[];
};

export type CommandProps = {
  items?: CommandItem[];
  groups?: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
  onSelect?: (key: Key) => void;
  className?: string;
};

export const Command = ({
  items = [],
  groups = [],
  placeholder = 'Search commands...',
  emptyText = 'No results found.',
  onSelect,
  className,
}: CommandProps) => {
  const { contains } = useFilter({ sensitivity: 'base' });

  const allItems = useMemo(() => {
    if (items.length > 0) {
      return items;
    }
    return groups.flatMap((group) => group.items);
  }, [items, groups]);

  const comboBoxProps: AriaComboBoxProps<CommandItem> = {
    items: allItems,
    inputValue: '',
    onInputChange: () => {},
    onSelectionChange: (key) => {
      if (key && onSelect) {
        onSelect(key);
      }
      const selectedItem = allItems.find((item) => item.id === key);
      selectedItem?.onSelect?.();
    },
    menuTrigger: 'focus',
  };

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listBoxRef = useRef<HTMLUListElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const state = useComboBoxState({
    ...comboBoxProps,
    defaultItems: allItems,
    children: (item: CommandItem) => <Item key={item.id}>{item.label}</Item>,
  });

  const { inputProps, listBoxProps } = useComboBox(
    {
      ...comboBoxProps,
      inputRef,
      buttonRef,
      listBoxRef,
      popoverRef,
    },
    state
  );

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const searchText = state.inputValue.toLowerCase();
      if (!searchText) return true;

      const labelMatch = item.label.toLowerCase().includes(searchText);
      const descriptionMatch = item.description?.toLowerCase().includes(searchText);
      const keywordsMatch = item.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchText)
      );

      return labelMatch || descriptionMatch || keywordsMatch;
    });
  }, [allItems, state.inputValue]);

  return (
    <div
      ref={popoverRef}
      className={cn(
        'flex flex-col w-full max-w-2xl bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden',
        className
      )}
    >
      <div className="flex items-center border-b border-base-300 px-3">
        <Search className="h-5 w-5 text-base-content/50" />
        <input
          {...inputProps}
          ref={inputRef}
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-base-content/50"
          placeholder={placeholder}
        />
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-base-300 bg-base-200 px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <CommandIcon className="h-3 w-3" />K
        </kbd>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-base-content/50">
            {emptyText}
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((group) => {
              const groupItems = filteredItems.filter((item) =>
                group.items.some((groupItem) => groupItem.id === item.id)
              );
              if (groupItems.length === 0) return null;

              return (
                <div key={group.id}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-base-content/70">
                    {group.label}
                  </div>
                  <CommandList
                    items={groupItems}
                    state={state}
                    listBoxProps={listBoxProps}
                    listBoxRef={listBoxRef}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <CommandList
            items={filteredItems}
            state={state}
            listBoxProps={listBoxProps}
            listBoxRef={listBoxRef}
          />
        )}
      </div>
    </div>
  );
};

type CommandListProps = {
  items: CommandItem[];
  state: any;
  listBoxProps: any;
  listBoxRef: React.RefObject<HTMLUListElement>;
};

const CommandList = ({ items, state, listBoxProps, listBoxRef }: CommandListProps) => {
  const { listBoxRef: _, ...restListBoxProps } = useListBox(
    {
      ...listBoxProps,
      'aria-label': 'Commands',
    },
    state,
    listBoxRef
  );

  return (
    <ul {...restListBoxProps} ref={listBoxRef} className="space-y-1">
      {items.map((item) => (
        <CommandOption key={item.id} item={item} state={state} />
      ))}
    </ul>
  );
};

type CommandOptionProps = {
  item: CommandItem;
  state: any;
};

const CommandOption = ({ item, state }: CommandOptionProps) => {
  const ref = useRef<HTMLLIElement>(null);
  const { optionProps, isSelected, isFocused } = useOption(
    { key: item.id },
    state,
    ref
  );

  return (
    <li
      {...optionProps}
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none',
        'hover:bg-base-200',
        isFocused && 'bg-base-200',
        isSelected && 'bg-primary/10'
      )}
    >
      {item.icon && (
        <span className="mr-2 h-4 w-4 flex items-center justify-center">
          {item.icon}
        </span>
      )}
      <div className="flex-1">
        <div className="font-medium">{item.label}</div>
        {item.description && (
          <div className="text-xs text-base-content/70">{item.description}</div>
        )}
      </div>
    </li>
  );
};

Command.displayName = 'Command';

