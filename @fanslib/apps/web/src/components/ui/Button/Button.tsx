import type { ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cn } from '~/lib/cn';

export type ButtonProps = AriaButtonProps & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className,
  style,
  isDisabled,
  ...props
}: ButtonProps) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost border-transparent hover:border-primary hover:bg-primary/20',
    error: 'btn-error',
    success: 'btn-success',
    warning: 'btn-warning',
    info: 'btn-info',
    outline: 'btn-outline border-1 hover:bg-primary/20 hover:ring-2 hover:ring-primary',
  };

  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'w-20 h-20',
    icon: 'btn-square',
  };

  return (
    <AriaButton
      {...props}
      isDisabled={isDisabled ?? isLoading}
      className={cn(
        'btn whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        'data-[pressed]:btn-active',
        className
      )}
      style={style}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          Loading...
        </>
      ) : (
        children
      )}
    </AriaButton>
  );
};

Button.displayName = 'Button';
