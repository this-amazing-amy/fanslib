import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

export type Step = {
  label: string;
  description?: string;
  icon?: ReactNode;
};

export type StepperProps = {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
};

export const Stepper = ({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  className,
  color = 'primary',
}: StepperProps) => {
  const colorClasses = {
    primary: 'step-primary',
    secondary: 'step-secondary',
    accent: 'step-accent',
    success: 'step-success',
    warning: 'step-warning',
    error: 'step-error',
    info: 'step-info',
  };

  return (
    <ul
      className={cn(
        'steps',
        orientation === 'vertical' && 'steps-vertical',
        className
      )}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = onStepClick && (isComplete || isCurrent);

        return (
          <li
            key={step.label}
            data-content={step.icon ?? (isComplete ? '✓' : index + 1)}
            className={cn(
              'step',
              (isComplete || isCurrent) && colorClasses[color],
              isClickable && 'cursor-pointer hover:opacity-80'
            )}
            onClick={isClickable ? () => onStepClick(index) : undefined}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{step.label}</span>
              {step.description && (
                <span className="text-xs text-base-content/70 mt-1">
                  {step.description}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

Stepper.displayName = 'Stepper';

