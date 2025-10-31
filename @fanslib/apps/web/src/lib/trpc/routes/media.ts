import { createMediaSchema, mediaTable, updateMediaSchema } from '@fanslib/db';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateTxId, procedure, router } from '../server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

const scanRequestSchema = z.object({
  contentPath: z.string(),
  options: z.object({}).optional(),
});

const scanStatusResponseSchema = z.object({
  status: z.enum(['idle', 'scanning', 'completed', 'error', 'cancelled']),
  progress: z.number(),
  totalFiles: z.number(),
  processedFiles: z.number(),
  currentFile: z.string().optional(),
  errors: z.array(z.string()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const scanResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string(),
  data: z
    .object({
      totalFiles: z.number(),
      newFiles: z.number(),
      updatedFiles: z.number(),
      errors: z.array(z.string()),
    })
    .optional(),
});

export const mediaRouter = router({
  create: procedure
    .input(createMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [newItem] = await tx.insert(mediaTable).values(input).returning();
        return { item: newItem, txid };
      });

      return result;
    }),

  update: procedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateMediaSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const txid = await generateTxId(tx);
        const [updatedItem] = await tx
          .update(mediaTable)
          .set(input.data)
          .where(eq(mediaTable.id, input.id))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Media not found',
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
          .delete(mediaTable)
          .where(eq(mediaTable.id, input.id))
          .returning();

        if (!deletedItem) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Media not found',
          });
        }

        return { item: deletedItem, txid };
      });

      return result;
    }),

  scan: procedure.input(scanRequestSchema).mutation(async ({ input }) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/media/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Backend scan failed: ${response.statusText}`,
        });
      }

      const result = await response.json();
      return scanResponseSchema.parse(result);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to trigger scan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }),

  scanStatus: procedure.query(async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/media/scan/status`);

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Backend status check failed: ${response.statusText}`,
        });
      }

      const result = await response.json();
      return scanStatusResponseSchema.parse(result);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get scan status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }),

  scanCancel: procedure.mutation(async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/media/scan/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Backend cancel failed: ${response.statusText}`,
        });
      }

      const result = await response.json();
      return z
        .object({
          status: z.enum(['success', 'error']),
          message: z.string(),
        })
        .parse(result);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to cancel scan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }),

  scanStatusSubscription: procedure.subscription(() =>
    observable<z.infer<typeof scanStatusResponseSchema>>((emit) => {
      const pollStatus = async () => {
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/api/media/scan/status`
          );
          if (response.ok) {
            const result = await response.json();
            const status = scanStatusResponseSchema.parse(result);
            emit.next(status);
          }
        } catch (error) {
          emit.error(
            new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Status polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          );
        }
      };

      const interval = setInterval(pollStatus, 1000);
      pollStatus();

      return () => {
        clearInterval(interval);
      };
    })
  ),
});
