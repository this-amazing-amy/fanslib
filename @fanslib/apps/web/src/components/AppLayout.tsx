import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { type ReactNode, useState } from 'react';
import { Logo } from '~/components/Logo';
import { NavigationMenu } from '~/components/NavigationMenu';
import { BurgerIcon } from '~/components/ui/BurgerIcon';
import { ThemeProvider } from '~/contexts/ThemeContext';
import { useSfwMode } from '~/hooks/useSfwMode';
import { cn } from '~/lib/cn';
import { mobileNavigationDrawerOpenAtom, sidebarCollapsedAtom, toggleSidebarAtom } from '~/state/sidebar';

export interface AppLayoutProps {
  children: ReactNode;
}

const MainContent = ({ children }: { children: ReactNode }) => {
  const { sfwMode, getBlurClassName } = useSfwMode();

  return (
    <main 
      className={cn(
        'flex-1 p-4 sm:p-6 lg:p-8 content-area overflow-x-auto',
        sfwMode && getBlurClassName()
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

  return (
    <ThemeProvider>
      <div className='drawer lg:drawer-open'>
        <input
          id='drawer-toggle'
          type='checkbox'
          className='drawer-toggle'
          checked={sidebarOpen}
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
                <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
                  <span className='text-primary-content font-bold text-lg'>
                    F
                  </span>
                </div>
                <span className='text-lg sm:text-xl font-bold'>FansLib</span>
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
