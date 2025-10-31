import { createFileRoute } from '@tanstack/react-router';
import { prepareElectricUrl, proxyElectricRequest } from '~/lib/electric-proxy';

export const Route = createFileRoute('/api/subreddits')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const originUrl = prepareElectricUrl(request.url);
        originUrl.searchParams.set('table', 'subreddits');
        return proxyElectricRequest(originUrl);
      },
    }
  }
})
