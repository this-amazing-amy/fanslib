import type { HTMLAttributes } from 'react';
import { cn } from '~/lib/cn';
import { Label } from '../Label';

export type FormFieldProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  description?: string;
  helperText?: string;
  spacing?: 'sm' | 'default' | 'lg';
};

export const FormField = ({
  className,
  spacing = 'default',
  label,
  htmlFor,
  error,
  required,
  description,
  helperText,
  children,
  ...props
}: FormFieldProps) => {
  const spacingClasses = {
    sm: 'gap-1',
    default: 'gap-3',
    lg: 'gap-4',
  };

  return (
    <div className={cn('form-control', spacingClasses[spacing], className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {description && !error && <p className="text-xs text-base-content/60 pl-3">{description}</p>}
      {helperText && !error && <p className="text-xs text-base-content/60 pl-3">{helperText}</p>}
      {error && <p className="text-xs text-error pl-3">{error}</p>}
    </div>
  );
};

