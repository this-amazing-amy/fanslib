import {
  createRouter as createTanStackRouter,
  ErrorComponent,
} from '@tanstack/react-router';
import { NotFound } from './components/NotFound';
import { routeTree } from './routeTree.gen';

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultErrorComponent: ErrorComponent,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        if (!fromLocation) return ['initial'];
        
        const fromIndex = fromLocation.state.__TSR_index || 0;
        const toIndex = toLocation.state.__TSR_index || 0;
        const direction = fromIndex > toIndex ? 'back' : 'forward';
        
        return [`slide-${direction}`];
      },
    },
  });

  return router;
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
