import { initTRPC } from '@trpc/server';
import { sql } from 'drizzle-orm';
import superjson from 'superjson';
import type { db } from '~/lib/db';

export type Context = {
  db: typeof db;
};

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;

export const generateTxId = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<number> => {
  // The ::xid cast strips off the epoch, giving you the raw 32-bit value
  // that matches what PostgreSQL sends in logical replication streams
  // (and then exposed through Electric which we'll match against
  // in the client).
  const result = await tx.execute(
    sql`SELECT pg_current_xact_id()::xid::text as txid`
  );
  const txid = result.rows[0]?.txid;

  if (txid === undefined) {
    throw new Error(`Failed to get transaction ID`);
  }

  return parseInt(txid as string, 10);
};
