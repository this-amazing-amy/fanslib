import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type CardProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export const Card = ({
  children,
  className,
  compact = false,
}: CardProps) => (
  <div
    className={cn(
      'card bg-base-100 border border-base-300',
      compact && 'card-compact',
      className
    )}
  >
    {children}
  </div>
);

export type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export const CardBody = ({ children, className }: CardBodyProps) => (
  <div className={cn('card-body', className)}>{children}</div>
);

export type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export const CardTitle = ({ children, className }: CardTitleProps) => (
  <h2 className={cn('card-title', className)}>{children}</h2>
);

export type CardActionsProps = {
  children: ReactNode;
  className?: string;
};

export const CardActions = ({ children, className }: CardActionsProps) => (
  <div className={cn('card-actions justify-end', className)}>{children}</div>
);

