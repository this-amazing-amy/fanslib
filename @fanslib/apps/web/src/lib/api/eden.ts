// DEPRECATED: Server migrated from Elysia to Hono. Use hono-client.ts instead.
// This file is kept for reference but is no longer functional.

/*
import { treaty } from '@elysiajs/eden';
import type { AppType } from '@fanslib/server';
import * as devalue from 'devalue';
import { backendBaseUrl } from '../config';

export const eden = treaty<AppType>(backendBaseUrl,
  {
    onResponse: async (response) => {
        const text = await response.text();
        return devalue.parse(text);
      }
  }
)
;
*/
