import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '../Button';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  const displayIcon = icon ?? <Inbox className="w-16 h-16 opacity-50" />;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="mb-4">{displayIcon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-base-content/70 mb-6 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};

