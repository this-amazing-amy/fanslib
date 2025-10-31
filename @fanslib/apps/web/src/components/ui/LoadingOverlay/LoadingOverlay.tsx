import { type ReactNode } from 'react';

type LoadingOverlayProps = {
  show?: boolean;
  message?: string;
  icon?: ReactNode;
  variant?: 'default' | 'dark' | 'light' | 'transparent';
  spinnerSize?: 'sm' | 'default' | 'lg' | 'xl';
  spinnerColor?: 'default' | 'muted' | 'white';
  className?: string;
};

const variantClasses = {
  default: 'bg-background/80 backdrop-blur-sm',
  dark: 'bg-black/50 backdrop-blur-sm',
  light: 'bg-white/80 backdrop-blur-sm',
  transparent: 'bg-transparent',
};

const spinnerSizeClasses = {
  sm: 'loading-sm',
  default: 'loading-md',
  lg: 'loading-lg',
  xl: 'loading-lg',
};

export const LoadingOverlay = ({
  show = true,
  message,
  icon,
  variant = 'default',
  spinnerSize = 'default',
  spinnerColor = 'default',
  className = '',
}: LoadingOverlayProps) => {
  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${variantClasses[variant]} ${className}`}
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        <div>
          {icon ?? (
            <span className={`loading loading-spinner ${spinnerSizeClasses[spinnerSize]}`} />
          )}
        </div>
        {message && <p className="text-sm text-muted-foreground max-w-sm">{message}</p>}
      </div>
    </div>
  );
};

export const LoadingOverlayPortal = ({ show = true, ...props }: LoadingOverlayProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <LoadingOverlay {...props} />
    </div>
  );
};


