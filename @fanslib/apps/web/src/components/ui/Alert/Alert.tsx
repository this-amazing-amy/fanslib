import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type AlertProps = {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  showIcon?: boolean;
};

export const Alert = ({
  variant = 'info',
  title,
  children,
  className,
  icon,
  showIcon = true,
}: AlertProps) => {
  const variantClasses = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };

  const defaultIcons = {
    info: <Info className="w-6 h-6" />,
    success: <CheckCircle className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
  };

  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      role="alert"
      className={cn('alert', variantClasses[variant], className)}
    >
      {showIcon && displayIcon}
      <div className="flex flex-col gap-1">
        {title && <span className="font-bold">{title}</span>}
        <span>{children}</span>
      </div>
    </div>
  );
};

