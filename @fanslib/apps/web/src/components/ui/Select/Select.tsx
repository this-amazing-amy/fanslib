import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { Button } from '~/components/ui/Button';
import { cn } from '~/lib/cn';


type SelectProps = Omit<AriaSelectProps<object>, 'children'> & {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export const Select = ({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  ...props
}: SelectProps) => <AriaSelect
      selectedKey={value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => onValueChange?.(key as string)}
      isDisabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </AriaSelect>;

type SelectTriggerProps = {
  children: ReactNode;
  className?: string;
}

export const SelectTrigger = ({ children, className }: SelectTriggerProps) => <Button
      variant="outline"
      className={cn(
        'input w-full flex items-center justify-between',
        'cursor-pointer',
        'border border-base-content',
        'transition-all duration-200',
        'hover:bg-primary/20 hover:ring-2 hover:ring-primary hover:border-primary',
        'focus:outline-none focus-visible:outline-none',
        'data-[focused]:ring-2 data-[focused]:ring-primary data-[focused]:ring-offset-2',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
    >
      {children}
      <ChevronDown aria-hidden="true" className="h-4 w-4 opacity-50 shrink-0 ml-2" />
    </Button>;

type SelectValueProps = {
  placeholder?: string;
  className?: string;
}

export const SelectValue = ({ placeholder, className }: SelectValueProps) => <AriaSelectValue
      className={cn(
        'flex-1 text-left truncate block',
        '[&:has([data-placeholder])]:text-base-content/50 [&:has([data-placeholder])]:font-normal',
        className
      )}
    >
      {({ selectedText }) => (
        <span data-placeholder={!selectedText ? '' : undefined}>
          {selectedText || placeholder}
        </span>
      )}
    </AriaSelectValue>;

type SelectContentProps = {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
}

export const SelectContent = ({ children, className }: SelectContentProps) => <Popover
      className={cn(
        'bg-base-100 rounded-xl border-2 border-base-content shadow-lg',
        'min-w-[--trigger-width] max-h-60 overflow-y-auto z-[80]',
        'entering:animate-in entering:fade-in entering:zoom-in-95',
        'exiting:animate-out exiting:fade-out exiting:zoom-out-95',
        className
      )}
      offset={4}
    >
      <ListBox className="outline-none p-1">{children}</ListBox>
    </Popover>;

type SelectItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  textValue?: string;
}

export const SelectItem = ({
  value,
  children,
  className,
  disabled,
  textValue,
}: SelectItemProps) => <ListBoxItem
      id={value}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      isDisabled={disabled}
      className={cn(
        'px-4 py-2 cursor-pointer rounded-lg outline-none',
        'hover:bg-primary/20 hover:ring-2 hover:ring-primary',
        'data-[selected]:bg-primary data-[selected]:text-primary-content',
        'data-[focused]:bg-primary/10',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
    >
      {children}
    </ListBoxItem>;

// Optional: Group component for organizing items
type SelectGroupProps = {
  children: ReactNode;
  label?: string;
  className?: string;
}

export const SelectGroup = ({ children, label, className }: SelectGroupProps) => <div className={cn('py-1', className)}>
      {label && (
        <div className="px-4 py-2 text-xs font-semibold text-base-content/70 uppercase">
          {label}
        </div>
      )}
      {children}
    </div>;

// Optional: Separator component
export const SelectSeparator = ({ className }: { className?: string }) => <div className={cn('my-1 h-px bg-base-content/20', className)} />;

// Optional: Label component
type SelectLabelProps = {
  children: ReactNode;
  className?: string;
}

export const SelectLabel = ({ children, className }: SelectLabelProps) => <Label className={cn('text-sm font-medium mb-1 block', className)}>{children}</Label>;

