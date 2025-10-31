import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { channelsTable } from './channels';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const contentSchedulesTable = pgTable('content_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .references(() => channelsTable.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  postsPerTimeframe: integer('posts_per_timeframe'),
  preferredDays: jsonb('preferred_days').$type<string[]>(),
  preferredTimes: jsonb('preferred_times').$type<string[]>(),
  mediaFilters: jsonb('media_filters'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const selectContentScheduleSchema = createSelectSchema(contentSchedulesTable);
export const createContentScheduleSchema = createInsertSchema(contentSchedulesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateContentScheduleSchema = createUpdateSchema(contentSchedulesTable);

export type ContentSchedule = z.infer<typeof selectContentScheduleSchema>;
export type CreateContentSchedule = z.infer<typeof createContentScheduleSchema>;
export type UpdateContentSchedule = z.infer<typeof updateContentScheduleSchema>;
