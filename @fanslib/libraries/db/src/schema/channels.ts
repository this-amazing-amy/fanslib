import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { hashtagsTable } from './hashtags';

export const channelTypesTable = pgTable('channel_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
});

export const channelsTable = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  typeId: text('type_id')
    .references(() => channelTypesTable.id)
    .notNull(),
  eligibleMediaFilter: jsonb('eligible_media_filter'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subredditsTable = pgTable('subreddits', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  maxPostFrequencyHours: integer('max_post_frequency_hours'),
  notes: text('notes'),
  memberCount: integer('member_count'),
  verificationStatus: text('verification_status', {
    enum: ['unknown', 'verified', 'unverified', 'required'],
  }).default('unknown'),
  defaultFlair: text('default_flair'),
  captionPrefix: text('caption_prefix'),
  eligibleMediaFilter: jsonb('eligible_media_filter'),
  postingTimesData: jsonb('posting_times_data'),
  postingTimesLastFetched: timestamp('posting_times_last_fetched'),
  postingTimesTimezone: text('posting_times_timezone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const channelDefaultHashtagsTable = pgTable(
  'channel_default_hashtags',
  {
    channelId: uuid('channel_id')
      .references(() => channelsTable.id, { onDelete: 'cascade' }),
    hashtagId: uuid('hashtag_id')
      .references(() => hashtagsTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.channelId, table.hashtagId] }),
  }),
);

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

// Channel Types Schemas
export const selectChannelTypeSchema = createSelectSchema(channelTypesTable);
export const createChannelTypeSchema = createInsertSchema(channelTypesTable);

export type ChannelType = z.infer<typeof selectChannelTypeSchema>;
export type CreateChannelType = z.infer<typeof createChannelTypeSchema>;

// Channels Schemas
export const selectChannelSchema = createSelectSchema(channelsTable);
export const createChannelSchema = createInsertSchema(channelsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateChannelSchema = createUpdateSchema(channelsTable);

export type Channel = z.infer<typeof selectChannelSchema>;
export type CreateChannel = z.infer<typeof createChannelSchema>;
export type UpdateChannel = z.infer<typeof updateChannelSchema>;

// Subreddits Schemas
export const selectSubredditSchema = createSelectSchema(subredditsTable);
export const createSubredditSchema = createInsertSchema(subredditsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateSubredditSchema = createUpdateSchema(subredditsTable);

export type Subreddit = z.infer<typeof selectSubredditSchema>;
export type CreateSubreddit = z.infer<typeof createSubredditSchema>;
export type UpdateSubreddit = z.infer<typeof updateSubredditSchema>;
