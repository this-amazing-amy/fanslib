import { createMediaTagSchema, mediaTagsTable } from '@fanslib/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateTxId, procedure, router } from '../server';

export const mediaTagsRouter = router({
  create: procedure
    .input(createMediaTagSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        console.log(input);
        const [newItem] = await tx
          .insert(mediaTagsTable)
          .values(input)
          .returning();
        return { item: newItem, txid };
      });

      return result;
    }),

  delete: procedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [deletedItem] = await tx
          .delete(mediaTagsTable)
          .where(eq(mediaTagsTable.id, input.id))
          .returning();

        if (!deletedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Media tag not found',
          });
        }

        return { item: deletedItem, txid };
      });

      return result;
    }),
});
