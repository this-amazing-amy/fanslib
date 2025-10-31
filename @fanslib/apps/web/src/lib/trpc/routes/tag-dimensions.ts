import { createTagDimensionSchema, tagDimensionsTable, updateTagDimensionSchema } from '@fanslib/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateTxId, procedure, router } from '../server';

export const tagDimensionsRouter = router({
  create: procedure
    .input(createTagDimensionSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        console.log(input);
        const [newItem] = await tx
          .insert(tagDimensionsTable)
          .values(input)
          .returning();
        return { item: newItem, txid };
      });

      return result;
    }),

  update: procedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateTagDimensionSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        const [updatedItem] = await tx
          .update(tagDimensionsTable)
          .set(input.data)
          .where(eq(tagDimensionsTable.id, input.id))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tag dimension not found',
          });
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
          .delete(tagDimensionsTable)
          .where(eq(tagDimensionsTable.id, input.id))
          .returning();

        if (!deletedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tag dimension not found',
          });
        }

        return { item: deletedItem, txid };
      });

      return result;
    }),
});
