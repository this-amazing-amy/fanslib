import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { type ReactNode, useEffect, useState } from 'react';
import { Logo } from '~/components/Logo';
import { NavigationMenu } from '~/components/NavigationMenu';
import { BurgerIcon } from '~/components/ui/BurgerIcon';
import { ThemeProvider } from '~/contexts/ThemeContext';
import { cn } from '~/lib/cn';
import { useToggleSfwModeMutation } from '~/lib/queries/settings';
import { mobileNavigationDrawerOpenAtom, sidebarCollapsedAtom, toggleSidebarAtom } from '~/state/sidebar';

export interface AppLayoutProps {
  children: ReactNode;
}

const MainContent = ({ children }: { children: ReactNode }) => {
  return (
    <main 
      className={cn(
        'flex-1 p-4 sm:p-6 lg:p-8 content-area overflow-x-auto'
      )}
      style={{ viewTransitionName: 'main-content' }}
    >
      {children}
    </main>
  );
};

const LayoutContent = ({ children }: AppLayoutProps) => {
  const [sidebarOpen] = useAtom(mobileNavigationDrawerOpenAtom);
  const [, toggleSidebar] = useAtom(toggleSidebarAtom);
  const [isCollapsed] = useAtom(sidebarCollapsedAtom);
  const toggleSfwMode = useToggleSfwModeMutation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleSfwMode.mutate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSfwMode]);


  return (
    <ThemeProvider>
      <div className='drawer lg:drawer-open'>
        <input
          id='drawer-toggle'
          type='checkbox'
          className='drawer-toggle'
          checked={sidebarOpen}
          aria-label='Toggle navigation menu'
          onChange={() => toggleSidebar()}
        />

        {/* Page content */}
        <div className='drawer-content flex flex-col min-h-screen'>
          <header className='main-header navbar bg-base-100 shadow-sm border-b border-base-300 lg:hidden h-16 px-4'>
            <div className='flex-none'>
              <label
                htmlFor='drawer-toggle'
                className='btn btn-square btn-ghost min-h-12 min-w-12'
              >
                <BurgerIcon />
              </label>
            </div>
            <div className='flex-1'>
              <div className='flex items-center space-x-2 ml-2'>
                <Logo isCollapsed={false} className="h-8" />
              </div>
            </div>
          </header>

          <MainContent>{children}</MainContent>
        </div>

        {/* Sidebar - Responsive width and touch-friendly */}
        <div className='drawer-side z-40'>
          <label
            htmlFor='drawer-toggle'
            className='drawer-overlay lg:hidden'
          ></label>
          <aside className={cn('sidebar min-h-full bg-base-200 text-base-content flex flex-col', 'w-64 sm:w-72', isCollapsed ? 'lg:w-20' : 'lg:w-80')}>
            {/* Sidebar header - Touch-friendly */}
            <div className={cn('p-4 lg:p-6', isCollapsed && 'lg:p-4')}>
              <Logo isCollapsed={isCollapsed} />
            </div>

            <NavigationMenu isCollapsed={isCollapsed} />
          </aside>
        </div>
      </div>
    </ThemeProvider>
  );
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LayoutContent>{children}</LayoutContent>
    </QueryClientProvider>
  );
};
