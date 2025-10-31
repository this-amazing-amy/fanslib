import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { channelsTable } from './channels';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const snippetsTable = pgTable('caption_snippets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  channelId: uuid('channel_id').references(() => channelsTable.id),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const selectSnippetSchema = createSelectSchema(snippetsTable);
export const createSnippetSchema = createInsertSchema(snippetsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateSnippetSchema = createUpdateSchema(snippetsTable);

export type SelectSnippet = z.infer<typeof selectSnippetSchema>;
export type CreateSnippet = z.infer<typeof createSnippetSchema>;
export type UpdateSnippet = z.infer<typeof updateSnippetSchema>;

