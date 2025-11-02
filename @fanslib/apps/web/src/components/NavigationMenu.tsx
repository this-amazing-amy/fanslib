import { Link } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { closeSidebarAtom } from '~/state/sidebar';

export const NavigationMenu = () => {
  const [, closeSidebar] = useAtom(closeSidebarAtom);

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: '🏠' },
    { to: '/media', label: 'Media', icon: '🎬' },
    { to: '/posts', label: 'Posts', icon: '📝' },
    { to: '/calendar', label: 'Calendar', icon: '📅' },
    { to: '/channels', label: 'Channels', icon: '📺' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleNavClick = () => {
    closeSidebar();
  };

  return (
    <nav className='flex-1 overflow-y-auto'>
      <ul className='menu p-4 lg:p-6 space-y-1'>
        {menuItems.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={handleNavClick}
              className='flex items-center space-x-3 px-4 py-3 lg:py-4 rounded-lg hover:bg-base-300 transition-colors min-h-12 [&.active]:bg-primary [&.active]:text-primary-content'
            >
              <span className='text-lg lg:text-xl'>{item.icon}</span>
              <span className='font-medium text-sm lg:text-base'>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
