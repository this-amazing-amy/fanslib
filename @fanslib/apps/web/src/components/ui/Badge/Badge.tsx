import type { MouseEvent, ReactNode } from 'react';
import { cn } from '~/lib/cn';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  outline?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLSpanElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLSpanElement>) => void;
};

export const Badge = ({
  variant = 'neutral',
  size = 'md',
  outline = false,
  children,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </span>
  );
};

