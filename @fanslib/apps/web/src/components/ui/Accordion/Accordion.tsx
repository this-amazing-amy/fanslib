import { cloneElement, type ReactElement, type ReactNode, createContext, useContext, useState } from 'react';
import { cn } from '~/lib/cn';

type AccordionContextType = {
  type: 'single' | 'multiple';
  value: string | string[];
  onValueChange: (itemValue: string) => void;
  collapsible: boolean;
};

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
};

type AccordionProps = {
  children: ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  collapsible?: boolean;
};

export const Accordion = ({
  children,
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange,
  className = '',
  collapsible = false,
}: AccordionProps) => {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue ?? (type === 'multiple' ? [] : '')
  );

  const value = controlledValue ?? internalValue;

  const handleValueChange = (itemValue: string) => {
    const newValue =
      type === 'multiple'
        ? Array.isArray(value)
          ? value.includes(itemValue)
            ? value.filter((v) => v !== itemValue)
            : [...value, itemValue]
          : [itemValue]
        : value === itemValue && collapsible
          ? ''
          : itemValue;

    onValueChange?.(newValue);
    if (!controlledValue) {
      setInternalValue(newValue);
    }
  };

  return (
    <AccordionContext.Provider value={{ type, value, onValueChange: handleValueChange, collapsible }}>
      <div className={`space-y-2 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
};

type AccordionItemContextType = {
  value: string;
  isOpen: boolean;
  toggle: () => void;
};

const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

const useAccordionItemContext = () => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger and AccordionContent must be used within AccordionItem');
  }
  return context;
};

type AccordionItemProps = {
  children: ReactNode;
  value: string;
  className?: string;
};

export const AccordionItem = ({ children, value, className = '' }: AccordionItemProps) => {
  const { value: accordionValue, onValueChange } = useAccordionContext();

  const isOpen = Array.isArray(accordionValue)
    ? accordionValue.includes(value)
    : accordionValue === value;

  const toggle = () => onValueChange(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen, toggle }}>
      <div className={`border border-base-300 rounded-lg ${className}`}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

type AccordionTriggerProps = {
  children: ReactElement;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

export const AccordionTrigger = ({ children, className, onClick }: AccordionTriggerProps) => {
  const { isOpen, toggle } = useAccordionItemContext();

  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void; className?: string };
  return cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      childProps.onClick?.(e);
      onClick?.(e);
      if (!e.defaultPrevented) {
        toggle();
      }
    },
    className: cn(childProps.className, className),
    'aria-expanded': isOpen,
  } as Partial<unknown>);
};

type AccordionContentProps = {
  children: ReactNode;
  className?: string;
};

export const AccordionContent = ({ children, className = '' }: AccordionContentProps) => {
  const { isOpen } = useAccordionItemContext();

  return (
    <div
      className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
    >
      <div className={`px-4 pb-4 pt-0 ${className}`}>{children}</div>
    </div>
  );
};

type CollapsibleProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export const Collapsible = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className = '',
}: CollapsibleProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const open = controlledOpen ?? internalOpen;

  const toggle = () => {
    const newOpen = !open;
    onOpenChange?.(newOpen);
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
  };

  return (
    <AccordionItemContext.Provider value={{ value: '', isOpen: open, toggle }}>
      <div className={className}>{children}</div>
    </AccordionItemContext.Provider>
  );
};

export const CollapsibleTrigger = AccordionTrigger;
export const CollapsibleContent = AccordionContent;

