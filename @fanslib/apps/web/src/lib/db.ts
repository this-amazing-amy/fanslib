import { drizzle } from 'drizzle-orm/node-postgres';

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not defined');
}

export const db = drizzle(url, { casing: `snake_case` });
