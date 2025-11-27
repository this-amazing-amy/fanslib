import { treaty } from '@elysiajs/eden';
import type { App } from '@fanslib/server';
import * as devalue from 'devalue';
import { backendBaseUrl } from '../config';

export const eden = treaty<App>(backendBaseUrl,
  {
    onResponse: async (response) => {
        const text = await response.text();
        return devalue.parse(text);
      }
  }
)
;
