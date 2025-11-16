import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';
import { cn } from '~/lib/cn';


interface SelectProps extends Omit<AriaSelectProps<object>, 'children'> {
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
}: SelectProps) => {
  return (
    <AriaSelect
      selectedKey={value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => onValueChange?.(key as string)}
      isDisabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </AriaSelect>
  );
};

interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
}

export const SelectTrigger = ({ children, className }: SelectTriggerProps) => {
  return (
    <Button
      className={cn(
        'input input-bordered w-full flex items-center justify-between',
        'focus:outline-none focus-visible:outline-none',
        'data-[focused]:ring-2 data-[focused]:ring-primary data-[focused]:ring-offset-2',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
    >
      {children}
      <ChevronDown aria-hidden="true" className="h-4 w-4 opacity-50 shrink-0 ml-2" />
    </Button>
  );
};

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const SelectValue = ({ placeholder, className }: SelectValueProps) => {
  return (
    <AriaSelectValue
      className={cn(
        'flex-1 text-left truncate block',
        '[&:has([data-placeholder])]:text-base-content/50',
        className
      )}
    >
      {({ selectedText }) => (
        <span data-placeholder={!selectedText ? '' : undefined}>
          {selectedText || placeholder}
        </span>
      )}
    </AriaSelectValue>
  );
};

interface SelectContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
}

export const SelectContent = ({ children, className }: SelectContentProps) => {
  return (
    <Popover
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
    </Popover>
  );
};

interface SelectItemProps {
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
}: SelectItemProps) => {
  return (
    <ListBoxItem
      id={value}
      textValue={textValue || (typeof children === 'string' ? children : undefined)}
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
    </ListBoxItem>
  );
};

// Optional: Group component for organizing items
interface SelectGroupProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export const SelectGroup = ({ children, label, className }: SelectGroupProps) => {
  return (
    <div className={cn('py-1', className)}>
      {label && (
        <div className="px-4 py-2 text-xs font-semibold text-base-content/70 uppercase">
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

// Optional: Separator component
export const SelectSeparator = ({ className }: { className?: string }) => {
  return <div className={cn('my-1 h-px bg-base-content/20', className)} />;
};

// Optional: Label component
interface SelectLabelProps {
  children: ReactNode;
  className?: string;
}

export const SelectLabel = ({ children, className }: SelectLabelProps) => {
  return <Label className={cn('text-sm font-medium mb-1 block', className)}>{children}</Label>;
};

