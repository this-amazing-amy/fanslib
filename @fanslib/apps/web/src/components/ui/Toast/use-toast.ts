import { useToastQueue } from 'react-stately';
import type { ToastContent } from './Toast';

export const useToast = () => {
  const state = useToastQueue<ToastContent>({
    maxVisibleToasts: 5,
  });

  const toast = (content: ToastContent) => {
    state.add(content, { timeout: 5000 });
  };

  return {
    ...state,
    toast,
    success: (title: string, description?: string) =>
      toast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => toast({ title, description, variant: 'error' }),
    warning: (title: string, description?: string) =>
      toast({ title, description, variant: 'warning' }),
    info: (title: string, description?: string) => toast({ title, description, variant: 'info' }),
  };
};

