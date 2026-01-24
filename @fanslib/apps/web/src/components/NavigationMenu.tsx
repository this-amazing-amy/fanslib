import type React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Radio, Calendar, Camera, ChevronDown, ChevronRight, Clapperboard, Columns, Hash, Home, Palette, PanelLeft, PanelLeftClose, PenTool, Settings } from 'lucide-react';
import { RedditIcon } from '~/components/icons';
import { cn } from '~/lib/cn';
import { closeSidebarAtom, toggleSidebarCollapsedAtom } from '~/state/sidebar';

type MenuItem = {
  to: string;
  label: string;
  icon: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: Array<{ to: string; label: string }>;
};

const menuItems: MenuItem[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/compose/draft', label: 'Compose', icon: PenTool },
  { to: '/orchestrate', label: 'Orchestrate', icon: Columns },
  { to: '/library', label: 'Library', icon: Clapperboard },
  { to: '/shoots', label: 'Shoots', icon: Camera },
  { to: '/plan', label: 'Plan', icon: Calendar },
  { to: '/content/channels', label: 'Channels', icon: Radio },
  { to: '/subreddits', label: 'Subreddits', icon: RedditIcon },
  { to: '/hashtags', label: 'Hashtags', icon: Hash },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { to: '/analytics/matching', label: 'Matching' },
    ],
  },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/component-showcase', label: 'UI Components', icon: Palette },
];

type NavigationMenuProps = {
  isCollapsed: boolean;
};

export const NavigationMenu = ({ isCollapsed }: NavigationMenuProps) => {
  const [, closeSidebar] = useAtom(closeSidebarAtom);
  const [, toggleCollapsed] = useAtom(toggleSidebarCollapsedAtom);
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['/analytics']));

  const closeSidebarAfterNavigate = () => {
    closeSidebar();
  };

  const toggleExpanded = (to: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(to)) {
        next.delete(to);
      } else {
        next.add(to);
      }
      return next;
    });
  };

  const isActive = (item: MenuItem): boolean => {
    if (item.to === location.pathname) return true;
    if (item.children) {
      return item.children.some((child) => child.to === location.pathname);
    }
    return false;
  };

  return (
    <>
      <nav className="flex-1 overflow-y-auto">
        <ul className={cn('menu space-y-1 p-4 lg:p-6', isCollapsed && 'lg:p-2 lg:flex lg:flex-col lg:items-center mx-auto')}>
          {menuItems.map((item) => {
            const { to, label, icon: Icon, children } = item;
            const hasChildren = children && children.length > 0;
            const isExpanded = expandedItems.has(to);
            const active = isActive(item);

            if (isCollapsed && hasChildren) {
              return (
                <li key={to} className={cn('lg:w-full lg:flex lg:justify-center')}>
                  <Link
                    to={children[0].to}
                    onClick={closeSidebarAfterNavigate}
                    aria-label={label}
                    className={cn(
                      'flex items-center rounded-lg text-sm font-medium transition-colors hover:bg-base-300 [&.active]:bg-primary [&.active]:text-primary-content',
                      'gap-3 px-4 py-3 min-h-12 lg:py-1',
                      'lg:w-10 lg:h-10 lg:justify-center lg:gap-0 lg:px-3 lg:py-3 lg:min-h-0'
                    )}
                  >
                    <Icon className="h-5 w-5 lg:h-6 lg:w-6 lg:h-8 lg:w-8" />
                  </Link>
                </li>
              );
            }

            if (!hasChildren) {
              return (
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
              );
            }

            return (
              <li key={to}>
                <button
                  onClick={() => toggleExpanded(to)}
                  className={cn(
                    'flex items-center flex-1 gap-3 px-4 py-3 min-h-12 lg:py-1 rounded-lg text-sm font-medium transition-colors',
                    'hover:bg-base-300',
                    active && 'bg-primary/10',
                    isCollapsed && 'lg:w-10 lg:h-10 lg:justify-center lg:gap-0 lg:px-3 lg:py-3 lg:min-h-0'
                  )}
                  aria-label={label}
                >
                  <Icon className={cn('h-5 w-5 lg:h-6 lg:w-6', isCollapsed && 'lg:h-8 lg:w-8')} />
                  <span className={cn('text-sm font-medium lg:text-base flex-1 text-left', isCollapsed && 'lg:hidden')}>{label}</span>
                  {!isCollapsed && (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )
                  )}
                </button>
                {isExpanded && !isCollapsed && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {children.map((child) => {
                      const childActive = location.pathname === child.to;
                      return (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            onClick={closeSidebarAfterNavigate}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-base-300',
                              childActive && 'bg-primary text-primary-content'
                            )}
                          >
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
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
