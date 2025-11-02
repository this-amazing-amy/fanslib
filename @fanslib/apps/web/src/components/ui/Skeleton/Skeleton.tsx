import { cn } from '~/lib/cn';

export type SkeletonProps = {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
};

export const Skeleton = ({
  variant = 'rectangular',
  width,
  height,
  className,
}: SkeletonProps) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  return (
    <div
      className={cn('skeleton opacity-50', variantClasses[variant], className)}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  );
};

