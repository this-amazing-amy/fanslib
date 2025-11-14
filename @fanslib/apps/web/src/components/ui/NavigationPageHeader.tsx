import { Link, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

export type NavigationTab = {
  label: string;
  to: string;
};

export type NavigationPageHeaderProps = {
  tabs: NavigationTab[];
  actions?: ReactNode;
  className?: string;
};

export const NavigationPageHeader = ({
  tabs,
  actions,
  className,
}: NavigationPageHeaderProps) => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className={cn('flex items-center justify-between gap-4 mb-6', className)}>
      <div className="flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = 
            currentPath === tab.to || 
            currentPath.startsWith(`${tab.to}/`) ||
            (currentPath === '/' && tab.to === '/content/library/media');
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'text-2xl font-bold transition-colors',
                isActive ? 'text-base-content' : 'text-base-content/50 hover:text-base-content/70'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

