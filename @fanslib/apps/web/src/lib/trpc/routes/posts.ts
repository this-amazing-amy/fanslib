import { createPostSchema, postsTable, updatePostSchema } from '@fanslib/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateTxId, procedure, router } from '../server';

export const postsRouter = router({
  create: procedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [newItem] = await tx
          .insert(postsTable)
          .values(input)
          .returning();
        return { item: newItem, txid };
      });
      return result;
    }),

  update: procedure
    .input(z.object({ id: z.string().uuid(), data: updatePostSchema }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [updatedItem] = await tx
          .update(postsTable)
          .set(input.data)
          .where(eq(postsTable.id, input.id))
          .returning();
        if (!updatedItem) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        return { item: updatedItem, txid };
      });
      return result;
    }),

  delete: procedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [deletedItem] = await tx
          .delete(postsTable)
          .where(eq(postsTable.id, input.id))
          .returning();
        if (!deletedItem) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        return { item: deletedItem, txid };
      });
      return result;
    }),
});
