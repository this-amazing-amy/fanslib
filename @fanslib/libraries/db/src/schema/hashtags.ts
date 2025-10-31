import { integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { channelsTable } from './channels';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const hashtagsTable = pgTable('hashtags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hashtagChannelStatsTable = pgTable(
  'hashtag_channel_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hashtagId: uuid('hashtag_id')
      .references(() => hashtagsTable.id)
      .notNull(),
    channelId: uuid('channel_id')
      .references(() => channelsTable.id)
      .notNull(),
    views: integer('views').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    hashtagChannelUnique: unique().on(table.hashtagId, table.channelId),
  }),
);

export const selectHashtagSchema = createSelectSchema(hashtagsTable);
export const createHashtagSchema = createInsertSchema(hashtagsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateHashtagSchema = createUpdateSchema(hashtagsTable);

export const selectHashtagChannelStatsSchema = createSelectSchema(hashtagChannelStatsTable);
export const createHashtagChannelStatsSchema = createInsertSchema(hashtagChannelStatsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateHashtagChannelStatsSchema = createUpdateSchema(hashtagChannelStatsTable);

export type SelectHashtag = z.infer<typeof selectHashtagSchema>;
export type CreateHashtag = z.infer<typeof createHashtagSchema>;
export type UpdateHashtag = z.infer<typeof updateHashtagSchema>;

export type SelectHashtagChannelStats = z.infer<typeof selectHashtagChannelStatsSchema>;
export type CreateHashtagChannelStats = z.infer<typeof createHashtagChannelStatsSchema>;
export type UpdateHashtagChannelStats = z.infer<typeof updateHashtagChannelStatsSchema>;
