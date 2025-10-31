import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';

export type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export const SectionHeader = ({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) => (
  <div className={cn('mb-4', className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-base-content/70 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </div>
);

