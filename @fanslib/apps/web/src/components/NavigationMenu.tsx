import type React from 'react';
import { Link } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import type { LucideIcon } from 'lucide-react';
import { Calendar, Camera, Clapperboard, Columns, GitMerge, Hash, Home, Monitor, Palette, PanelLeft, PanelLeftClose, Settings } from 'lucide-react';
import { RedditIcon } from '~/components/icons';
import { cn } from '~/lib/cn';
import { closeSidebarAtom, toggleSidebarCollapsedAtom } from '~/state/sidebar';

type MenuItem = {
  to: string;
  label: string;
  icon: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const menuItems: MenuItem[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/library', label: 'Library', icon: Clapperboard },
  { to: '/shoots', label: 'Shoots', icon: Camera },
  { to: '/plan', label: 'Plan', icon: Calendar },
  { to: '/orchestrate', label: 'Orchestrate', icon: Columns },
  { to: '/content/channels', label: 'Channels', icon: Monitor },
  { to: '/subreddits', label: 'Subreddits', icon: RedditIcon },
  { to: '/hashtags', label: 'Hashtags', icon: Hash },
  { to: '/analytics/matching', label: 'Analytics Matching', icon: GitMerge },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/component-showcase', label: 'UI Components', icon: Palette },
];

type NavigationMenuProps = {
  isCollapsed: boolean;
};

export const NavigationMenu = ({ isCollapsed }: NavigationMenuProps) => {
  const [, closeSidebar] = useAtom(closeSidebarAtom);
  const [, toggleCollapsed] = useAtom(toggleSidebarCollapsedAtom);

  const closeSidebarAfterNavigate = () => {
    closeSidebar();
  };

  return (
    <>
      <nav className="flex-1 overflow-y-auto">
        <ul className={cn('menu space-y-1 p-4 lg:p-6', isCollapsed && 'lg:p-2 lg:flex lg:flex-col lg:items-center mx-auto')}>
          {menuItems.map(({ to, label, icon: Icon }) => (
            <li key={to} className={cn(isCollapsed && 'lg:w-full lg:flex lg:justify-center')}>
              <Link
                to={to}
                onClick={closeSidebarAfterNavigate}
                aria-label={label}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors hover:bg-base-300 [&.active]:bg-primary [&.active]:text-primary-content',
                  'gap-3 px-4 py-3 min-h-12 lg:py-1',
                  isCollapsed && 'lg:w-10 lg:h-10 lg:justify-center lg:gap-0 lg:px-3 lg:py-3 lg:min-h-0'
                )}
              >
                <Icon className={cn('h-5 w-5 lg:h-6 lg:w-6', isCollapsed && 'lg:h-8 lg:w-8')} />
                <span className={cn('text-sm font-medium lg:text-base', isCollapsed && 'lg:hidden')}>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden lg:flex justify-center p-2">
        <button
          onClick={() => toggleCollapsed()}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-base-300 p-2"
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
    </>
  );
};
