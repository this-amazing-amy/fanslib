import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { AriaToastProps, AriaToastRegionProps } from 'react-aria';
import { useToast, useToastRegion } from 'react-aria';
import type { ToastState } from 'react-stately';
import { X } from 'lucide-react';
import { cn } from '~/lib/cn';
import { Button } from '../Button';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export type ToastProps = AriaToastProps<any> & {
  state: ToastState<any>;
  className?: string;
  variant?: ToastVariant;
};

const variantClasses: Record<ToastVariant, string> = {
  default: 'alert',
  success: 'alert alert-success',
  error: 'alert alert-error',
  warning: 'alert alert-warning',
  info: 'alert alert-info',
};

export const Toast = ({ state, className, variant = 'default', ...props }: ToastProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { toastProps, titleProps, closeButtonProps } = useToast(props, state, ref);

  return (
    <div
      {...toastProps}
      ref={ref}
      className={cn(
        'shadow-lg rounded-lg flex items-center justify-between gap-4',
        variantClasses[variant],
        'animate-in fade-in-0 slide-in-from-top-full',
        'data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right-full',
        className
      )}
    >
      <div className="flex-1">
        {props.toast.title ? (
          <div {...titleProps} className="font-semibold">
            {props.toast.title}
          </div>
        ) : null}
        {props.toast.description ? (
          <div className="text-sm opacity-90">{props.toast.description}</div>
        ) : null}
      </div>
      {props.toast.action ? <div>{props.toast.action}</div> : null}
      <Button
        {...closeButtonProps}
        variant="ghost"
        size="xs"
        className="btn-circle"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export type ToastRegionProps = {
  state: ToastState<any>;
  className?: string;
};

export const ToastRegion = ({ state, className }: ToastRegionProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const toasts = state.visibleToasts ? Array.from(state.visibleToasts) : [];

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      aria-live="polite"
      aria-label="Notifications"
      className={cn(
        'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 md:max-w-[420px]',
        className
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.key} toast={toast} state={state} variant={toast.content?.variant} />
      ))}
    </div>
  );
};

export type ToastContent = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: ToastVariant;
};

