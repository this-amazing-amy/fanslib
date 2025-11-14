import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) => (
  <div className={cn('mb-6', className)}>
    {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-base-content/70 mt-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </div>
);

