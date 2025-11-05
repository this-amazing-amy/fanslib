import { forwardRef, type ReactNode } from 'react';

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
  maxHeight?: string;
};

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(({
  children,
  className = '',
  orientation = 'vertical',
  maxHeight,
}, ref) => {
  const orientationClasses = {
    vertical: 'overflow-y-auto overflow-x-hidden',
    horizontal: 'overflow-x-auto overflow-y-hidden',
    both: 'overflow-auto',
  };

  return (
    <div
      ref={ref}
      className={`relative ${orientationClasses[orientation]} ${className}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';

type ScrollBarProps = {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
};

export const ScrollBar = ({ className: _className = '', orientation: _orientation = 'vertical' }: ScrollBarProps) => null;


