import { treaty } from '@elysiajs/eden';
import type { App } from '@fanslib/server';
import superjson from 'superjson';

export const eden = treaty<App>('http://localhost:8001',
  {
    onResponse: async (response) => response.text().then(superjson.parse)
  }
)
;
