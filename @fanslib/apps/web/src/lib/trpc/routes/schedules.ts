import { createContentScheduleSchema, contentSchedulesTable, updateContentScheduleSchema } from '@fanslib/db';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateTxId, procedure, router } from '../server';

export const schedulesRouter = router({
  create: procedure
    .input(createContentScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        console.log(input);
        const [newItem] = await tx
          .insert(contentSchedulesTable)
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
        data: updateContentScheduleSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);

        const [updatedItem] = await tx
          .update(contentSchedulesTable)
          .set(input.data)
          .where(eq(contentSchedulesTable.id, input.id))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Schedule not found',
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
          .delete(contentSchedulesTable)
          .where(eq(contentSchedulesTable.id, input.id))
          .returning();

        if (!deletedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Schedule not found',
          });
        }

        return { item: deletedItem, txid };
      });

      return result;
    }),
});
