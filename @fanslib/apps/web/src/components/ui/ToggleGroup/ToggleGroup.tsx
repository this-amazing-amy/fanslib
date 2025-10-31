import type { ReactNode, Key } from 'react';
import { useRef } from 'react';
import type { AriaRadioGroupProps } from 'react-aria';
import { useRadioGroup, useRadio, useFocusRing, mergeProps } from 'react-aria';
import { useRadioGroupState } from 'react-stately';
import type { RadioGroupState } from 'react-stately';
import { cn } from '~/lib/utils';

export type ToggleGroupOption = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type ToggleGroupProps = Omit<AriaRadioGroupProps, 'children'> & {
  options: ToggleGroupOption[];
  variant?: 'default' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

export const ToggleGroup = ({
  options,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  className,
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
          'btn-group',
          orientation === 'vertical' && 'btn-group-vertical'
        )}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            option={option}
            state={state}
            variant={variant}
            size={size}
          />
        ))}
      </div>
    </div>
  );
};

type ToggleGroupItemProps = {
  option: ToggleGroupOption;
  state: RadioGroupState;
  variant: 'default' | 'outline' | 'primary';
  size: 'sm' | 'md' | 'lg';
};

const ToggleGroupItem = ({
  option,
  state,
  variant,
  size,
}: ToggleGroupItemProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const { inputProps } = useRadio(
    {
      value: option.value,
      isDisabled: option.disabled,
    },
    state,
    ref
  );
  const { focusProps, isFocusVisible } = useFocusRing();

  const isSelected = state.selectedValue === option.value;

  const variantClasses = {
    default: cn(
      'bg-transparent hover:bg-base-200',
      isSelected && 'bg-base-200'
    ),
    outline: cn(
      'border border-base-300 bg-transparent hover:bg-base-200',
      isSelected && 'bg-base-200 border-base-300'
    ),
    primary: cn(
      'bg-transparent hover:bg-base-200',
      isSelected && 'btn-primary'
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
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        option.disabled && 'btn-disabled',
        isFocusVisible && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <input
        {...mergeProps(inputProps, focusProps)}
        ref={ref}
        className="sr-only"
      />
      {option.icon && <span className="mr-2">{option.icon}</span>}
      {option.label}
    </label>
  );
};

ToggleGroup.displayName = 'ToggleGroup';

