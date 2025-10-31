import { createShootSchema, shootsTable, updateShootSchema } from '@fanslib/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateTxId, procedure, router } from '../server';

export const shootsRouter = router({
  create: procedure
    .input(createShootSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        const [newItem] = await tx
          .insert(shootsTable)
          .values({
            ...input,
          })
          .returning();
        return { item: newItem, txid };
      });

      return result;
    }),

  update: procedure
    .input(
      z.object({
        id: z.uuid(),
        data: updateShootSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        const [updatedItem] = await tx
          .update(shootsTable)
          .set(input.data)
          .where(eq(shootsTable.id, input.id))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Shoot not found',
          });
        }

        return { item: updatedItem, txid };
      });

      return result;
    }),

  delete: procedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [deletedItem] = await tx
          .delete(shootsTable)
          .where(eq(shootsTable.id, input.id))
          .returning();

        if (!deletedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Shoot not found',
          });
        }

        return { item: deletedItem, txid };
      });

      return result;
    }),
});
