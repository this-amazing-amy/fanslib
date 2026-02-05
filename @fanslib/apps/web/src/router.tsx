import { QueryClient } from '@tanstack/react-query';
import {
  createRouter as createTanStackRouter,
  ErrorComponent,
} from '@tanstack/react-router';
import { NotFound } from './components/NotFound';
import { routeTree } from './routeTree.gen';

// Router context type - available in route loaders
export type RouterContext = {
  queryClient: QueryClient;
};

// Shared QueryClient instance - created at module level for router context
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

export const getRouter = () => {
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
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
