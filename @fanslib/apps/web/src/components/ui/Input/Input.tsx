import type { InputHTMLAttributes } from 'react';
import { useRef } from 'react';
import type { AriaTextFieldProps } from 'react-aria';
import { useTextField } from 'react-aria';
import { cn } from '~/lib/cn';

export type InputProps = Omit<AriaTextFieldProps, 'min' | 'max' | 'step'> & {
  variant?: 'default' | 'ghost';
  className?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
} & Pick<InputHTMLAttributes<HTMLInputElement>, 'min' | 'max' | 'step' | 'onKeyDown'>;

export const Input = ({
  variant = 'default',
  className,
  type = 'text',
  min,
  max,
  step,
  onKeyDown,
  ...props
}: InputProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const { inputProps } = useTextField(
    { ...props, inputElementType: 'input' },
    ref
  );

  const variantClasses = {
    default: 'input',
    ghost: 'input-ghost',
  };

  return (
    <input
      {...inputProps}
      onKeyDown={onKeyDown}
      ref={ref}
      type={type}
      min={min}
      max={max}
      step={step}
      className={cn('input border w-full focus:outline-none', variantClasses[variant], className)}
    />
  );
};

