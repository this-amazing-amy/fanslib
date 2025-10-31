import { createFileRoute } from '@tanstack/react-router';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { trpcRouter } from '~/lib/trpc/routes';
import { db } from '~/lib/db';

export type AppRouter = typeof trpcRouter;

const serve = ({ request }: { request: Request }) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: trpcRouter,
    createContext: async () => ({
      db,
    }),
  });

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: serve,
      POST: serve,
    }
  }
})
