import type { InputHTMLAttributes } from 'react';
import { useRef } from 'react';
import type { AriaTextFieldProps } from 'react-aria';
import { useTextField } from 'react-aria';
import { cn } from '~/lib/cn';

export type InputProps = AriaTextFieldProps & {
  variant?: 'default' | 'ghost';
  className?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
};

export const Input = ({
  variant = 'default',
  className,
  type = 'text',
  ...props
}: InputProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const { inputProps } = useTextField(
    { ...props, inputElementType: 'input' },
    ref
  );

  const variantClasses = {
    default: 'input-bordered',
    ghost: 'input-ghost',
  };

  return (
    <input
      {...inputProps}
      ref={ref}
      type={type}
      className={cn('input w-full focus:outline-none', variantClasses[variant], className)}
    />
  );
};

