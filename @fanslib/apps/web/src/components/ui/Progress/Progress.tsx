import { useRef } from 'react';
import type { AriaProgressBarProps } from 'react-aria';
import { useProgressBar } from 'react-aria';
import { cn } from '~/lib/utils';

export type ProgressProps = AriaProgressBarProps & {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  showLabel?: boolean;
};

export const Progress = ({
  variant = 'primary',
  className,
  showLabel = false,
  ...props
}: ProgressProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { progressBarProps, labelProps } = useProgressBar(props, ref);

  const variantClasses = {
    primary: 'progress-primary',
    secondary: 'progress-secondary',
    accent: 'progress-accent',
    success: 'progress-success',
    warning: 'progress-warning',
    error: 'progress-error',
    info: 'progress-info',
  };

  const percentage = props.value !== undefined && props.maxValue !== undefined
    ? Math.round((props.value / props.maxValue) * 100)
    : 0;

  return (
    <div className="w-full">
      {(showLabel || props.label) && (
        <div className="flex justify-between mb-1">
          {props.label && (
            <span {...labelProps} className="text-sm font-medium">
              {props.label}
            </span>
          )}
          {showLabel && props.value !== undefined && (
            <span className="text-sm font-medium">{percentage}%</span>
          )}
        </div>
      )}
      <progress
        {...progressBarProps}
        ref={ref}
        className={cn('progress w-full', variantClasses[variant], className)}
        value={props.value}
        max={props.maxValue}
      />
    </div>
  );
};

