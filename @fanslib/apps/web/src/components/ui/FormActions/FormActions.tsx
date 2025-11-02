import type { HTMLAttributes } from 'react';
import { cn } from '~/lib/cn';

export type FormActionsProps = HTMLAttributes<HTMLDivElement> & {
  justify?: 'start' | 'end' | 'center' | 'between';
  direction?: 'row' | 'col';
  spacing?: 'none' | 'sm' | 'default' | 'lg';
  responsive?: boolean;
};

export const FormActions = ({
  className,
  justify = 'end',
  direction = 'row',
  spacing = 'default',
  responsive = false,
  ...props
}: FormActionsProps) => {
  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  };

  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  };

  const spacingClasses = {
    none: '',
    sm: direction === 'row' ? 'gap-2' : 'gap-2',
    default: direction === 'row' ? 'gap-3' : 'gap-3',
    lg: direction === 'row' ? 'gap-4' : 'gap-4',
  };

  const responsiveClass = responsive ? 'flex-col sm:flex-row' : '';

  return (
    <div
      className={cn(
        'flex',
        justifyClasses[justify],
        directionClasses[direction],
        spacingClasses[spacing],
        responsiveClass,
        className
      )}
      {...props}
    />
  );
};

