import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: ReactNode;
};

export const Separator = ({
  orientation = 'horizontal',
  className,
  children,
}: SeparatorProps) => {
  const orientationClass = orientation === 'vertical' ? 'divider-horizontal' : 'divider';

  return children ? (
    <div className={cn(orientationClass, className)}>{children}</div>
  ) : (
    <div className={cn(orientationClass, className)} />
  );
};

