import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { channelsTable, subredditsTable } from './channels';
import { mediaTable } from './media';
import { contentSchedulesTable } from './schedules';

export const postsTable = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  caption: text('caption'),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: text('status', { enum: ['draft', 'scheduled', 'posted'] })
    .notNull()
    .default('draft'),
  url: text('url'),
  fanslyStatisticsId: text('fansly_statistics_id'),
  fypRemovedAt: timestamp('fyp_removed_at'),
  channelId: uuid('channel_id')
    .references(() => channelsTable.id)
    .notNull(),
  subredditId: uuid('subreddit_id').references(() => subredditsTable.id),
  scheduleId: uuid('schedule_id').references(() => contentSchedulesTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postMediaTable = pgTable('post_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .references(() => postsTable.id, { onDelete: 'cascade' })
    .notNull(),
  mediaId: uuid('media_id')
    .references(() => mediaTable.id, { onDelete: 'cascade' })
    .notNull(),
  order: integer('order').notNull(),
  isFreePreview: boolean('is_free_preview').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const selectPostSchema = createSelectSchema(postsTable);
export const createPostSchema = createInsertSchema(postsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updatePostSchema = createUpdateSchema(postsTable);

export const selectPostMediaSchema = createSelectSchema(postMediaTable);
export const createPostMediaSchema = createInsertSchema(postMediaTable).omit({
  createdAt: true,
});

export type Post = z.infer<typeof selectPostSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type PostMedia = z.infer<typeof selectPostMediaSchema>;
export type CreatePostMedia = z.infer<typeof createPostMediaSchema>;
