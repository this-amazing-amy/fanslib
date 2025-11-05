import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  outline?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export const Badge = ({
  variant = 'neutral',
  size = 'md',
  outline = false,
  children,
  className,
  style,
  onClick,
}: BadgeProps) => {
  const variantClasses = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    ghost: 'badge-ghost',
    info: 'badge-info',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    neutral: 'badge-neutral',
  };

  const sizeClasses = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  };

  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        outline && 'badge-outline',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

