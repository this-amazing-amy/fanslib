import { treaty } from '@elysiajs/eden';
import type { App } from '@fanslib/server';
import { stringify } from 'devalue';

export const eden = (apiUrl: string) =>
  treaty<App>(apiUrl, {
    onRequest: (path, options) => {
      if (options.body) {
        options.body = stringify(options.body);
      }
    },
  });
