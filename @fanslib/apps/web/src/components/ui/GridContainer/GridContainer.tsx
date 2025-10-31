import { type ReactNode } from 'react';

type GridContainerProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto';
  gap?: 'none' | 'sm' | 'default' | 'lg' | 'xl';
  className?: string;
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
  auto: 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
};

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  default: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

export const GridContainer = ({
  children,
  columns = 3,
  gap = 'default',
  className = '',
}: GridContainerProps) => {
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};


