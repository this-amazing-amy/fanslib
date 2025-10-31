import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type StatusProps = {
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
  children: ReactNode;
  className?: string;
};

export const Status = ({
  variant = 'neutral',
  children,
  className,
}: StatusProps) => {
  const variantColors = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    neutral: 'text-base-content',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    neutral: 'bg-base-content',
  };

  return (
    <span className={cn('inline-flex items-center gap-2 text-sm', variantColors[variant], className)}>
      <span className={cn('w-2 h-2 rounded-full', dotColors[variant])} />
      {children}
    </span>
  );
};

