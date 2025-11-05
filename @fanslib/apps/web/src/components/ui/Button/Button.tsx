import type { ReactNode } from 'react';
import { forwardRef, useRef } from 'react';
import type { AriaButtonProps } from 'react-aria';
import { useButton } from 'react-aria';
import { cn } from '~/lib/cn';

export type ButtonProps = AriaButtonProps & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className,
  ...props
}, forwardedRef) => {
  const internalRef = useRef<HTMLButtonElement>(null);
  const ref = forwardedRef ?? internalRef;
  const { buttonProps, isPressed } = useButton(
    { ...props, isDisabled: props.isDisabled ?? isLoading },
    ref as React.RefObject<HTMLButtonElement>
  );

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    error: 'btn-error',
    success: 'btn-success',
    warning: 'btn-warning',
    info: 'btn-info',
    outline: 'btn-outline',
  };

  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    icon: 'btn-square',
  };

  return (
    <button
      {...buttonProps}
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={cn(
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        isPressed && 'btn-active',
        className
      )}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';
