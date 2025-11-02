import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { type ReactNode, useState } from 'react';
import { NavigationMenu } from '~/components/NavigationMenu';
import { BurgerIcon } from '~/components/ui/BurgerIcon';
import { sidebarOpenAtom, toggleSidebarAtom } from '~/state/sidebar';

export interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen] = useAtom(sidebarOpenAtom);
  const [, toggleSidebar] = useAtom(toggleSidebarAtom);

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

          <main className='flex-1 p-4 sm:p-6 lg:p-8 content-area overflow-x-auto'>
            {children}
          </main>
        </div>

        {/* Sidebar - Responsive width and touch-friendly */}
        <div className='drawer-side z-40'>
          <label
            htmlFor='drawer-toggle'
            className='drawer-overlay lg:hidden'
          ></label>
          <aside className='sidebar min-h-full w-64 sm:w-72 lg:w-80 bg-base-200 text-base-content'>
            {/* Sidebar header - Touch-friendly */}
            <div className='p-4 lg:p-6 border-b border-base-300'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 lg:w-10 lg:h-10 bg-primary rounded-lg flex items-center justify-center'>
                  <span className='text-primary-content font-bold text-lg lg:text-xl'>
                    F
                  </span>
                </div>
                <span className='text-xl lg:text-2xl font-bold'>FansLib</span>
              </div>
            </div>

            <NavigationMenu />
          </aside>
        </div>
      </div>
    </QueryClientProvider>
  );
};
