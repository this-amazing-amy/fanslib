import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';
import { Button } from '../Button';

export type ErrorStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  error?: Error | string;
  retry?: {
    label?: string;
    onClick: () => void;
  };
  className?: string;
};

export const ErrorState = ({
  icon,
  title,
  description,
  error,
  retry,
  className,
}: ErrorStateProps) => {
  const displayIcon = icon ?? <AlertCircle className="w-16 h-16 text-error" />;
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="mb-4">{displayIcon}</div>
      <h3 className="text-lg font-semibold mb-2 text-error">{title}</h3>
      {description && <p className="text-base-content/70 mb-2 max-w-sm">{description}</p>}
      {errorMessage && (
        <p className="text-sm text-base-content/50 mb-6 max-w-md font-mono bg-base-200 px-4 py-2 rounded">
          {errorMessage}
        </p>
      )}
      {retry && (
        <Button onPress={retry.onClick} variant="error">
          {retry.label ?? 'Try Again'}
        </Button>
      )}
    </div>
  );
};

