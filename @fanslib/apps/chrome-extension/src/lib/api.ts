import { treaty } from '@elysiajs/eden';
import type { App } from '@fanslib/server';

export const eden = (apiUrl: string) => treaty<App>(apiUrl);
