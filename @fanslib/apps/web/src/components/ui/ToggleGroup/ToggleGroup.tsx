import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { AriaRadioGroupProps } from 'react-aria';
import { mergeProps, useFocusRing, useRadio, useRadioGroup } from 'react-aria';
import type { RadioGroupState } from 'react-stately';
import { useRadioGroupState } from 'react-stately';
import { cn } from '~/lib/cn';

export type ToggleGroupOption = {
  value: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
};

export type ToggleGroupProps = Omit<AriaRadioGroupProps, 'children'> & {
  options: ToggleGroupOption[];
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  optionsClassName?: string;
  itemClassName?: string;
};

export const ToggleGroup = ({
  options,
  variant = 'primary',
  size = 'md',
  orientation = 'horizontal',
  className,
  optionsClassName,
  itemClassName,
  ...props
}: ToggleGroupProps) => {
  const state = useRadioGroupState(props);
  const { radioGroupProps, labelProps } = useRadioGroup(props, state);

  return (
    <div {...radioGroupProps} className={cn('form-control', className)}>
      {props.label && (
        <label {...labelProps} className="label">
          <span className="label-text">{props.label}</span>
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-1 p-1 border border-base-300 !rounded-full',
          orientation === 'vertical' && 'flex-col',
          optionsClassName
        )}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            option={option}
            state={state}
            variant={variant}
            size={size}
            className={itemClassName}
          />
        ))}
      </div>
    </div>
  );
};

type ToggleGroupItemProps = {
  option: ToggleGroupOption;
  state: RadioGroupState;
  variant: 'primary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  className?: string;
};

const ToggleGroupItem = ({
  option,
  state,
  variant,
  size,
  className,
}: ToggleGroupItemProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const hasVisibleContent = [option.label, option.icon].some(
    (value) => value !== undefined && value !== null
  );
  const { inputProps } = useRadio(
    {
      value: option.value,
      isDisabled: option.disabled,
      'aria-label': option.ariaLabel ?? (!hasVisibleContent ? option.value : undefined),
    },
    state,
    ref
  );
  const { focusProps, isFocusVisible } = useFocusRing();

  const isSelected = state.selectedValue === option.value;

  const variantClasses = {
    primary: cn(
      'bg-transparent hover:bg-primary/10',
      isSelected && 'bg-primary text-primary-content font-semibold border-2 border-primary'
    ),
    outline: cn(
      'bg-transparent hover:bg-base-200 border border-transparent',
      isSelected && 'bg-base-300 border-base-content/30 font-semibold'
    ),
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  return (
    <label
      className={cn(
        'btn rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        option.disabled && 'btn-disabled',
        isFocusVisible && 'ring-2 ring-primary ring-offset-2',
        className
      )}
      aria-label={option.ariaLabel}
    >
      <input
        {...mergeProps(inputProps, focusProps)}
        ref={ref}
        className="sr-only"
      />
      {option.icon && (
        <span className={cn(option.label ? 'mr-2' : undefined)}>{option.icon}</span>
      )}
      {option.label}
    </label>
  );
};

ToggleGroup.displayName = 'ToggleGroup';

