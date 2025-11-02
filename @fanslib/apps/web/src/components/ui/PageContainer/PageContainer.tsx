import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

export type PageContainerProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
};

export const PageContainer = ({
  children,
  className,
  maxWidth = 'full',
}: PageContainerProps) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('w-full mx-auto px-4 py-6', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
};

