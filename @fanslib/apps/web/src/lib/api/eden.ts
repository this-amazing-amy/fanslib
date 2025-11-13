import { treaty } from '@elysiajs/eden';
import type { App } from '@fanslib/server';
import * as devalue from 'devalue';

export const eden = treaty<App>('http://localhost:8001',
  {
    onResponse: async (response) => {
        const text = await response.text();
        return devalue.parse(text);
      }
  }
)
;
