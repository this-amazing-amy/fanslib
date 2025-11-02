import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { AriaToggleButtonProps } from 'react-aria';
import { useToggleButton } from 'react-aria';
import { useToggleState } from 'react-stately';
import { cn } from '~/lib/cn';

export type ToggleProps = AriaToggleButtonProps & {
  variant?: 'default' | 'outline' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
};

export const Toggle = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}: ToggleProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const state = useToggleState(props);
  const { buttonProps, isPressed } = useToggleButton(props, state, ref);

  const variantClasses = {
    default: cn(
      'bg-transparent hover:bg-base-200',
      state.isSelected && 'bg-base-200'
    ),
    outline: cn(
      'border border-base-300 bg-transparent hover:bg-base-200',
      state.isSelected && 'bg-base-200 border-base-300'
    ),
    ghost: cn(
      'hover:bg-base-200',
      state.isSelected && 'bg-base-200 text-base-content'
    ),
    primary: cn(
      'bg-transparent hover:bg-base-200',
      state.isSelected && 'bg-primary text-primary-content'
    ),
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-sm',
    md: 'h-10 px-3 text-base',
    lg: 'h-11 px-5 text-lg',
  };

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'ring-offset-base-100 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        isPressed && 'scale-95',
        className
      )}
    >
      {children}
    </button>
  );
};

Toggle.displayName = 'Toggle';

