import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { shootsTable } from './shoots';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const mediaTable = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type', { enum: ['image', 'video'] }).notNull(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  filesize: bigint('filesize', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'), // Duration in seconds for videos, null for images
  hash: text('hash'),
  filepath: text('filepath').notNull(),
  thumbnailPath: text('thumbnail_path'),
  redgifsUrl: text('redgifs_url'),
  fileCreationDate: timestamp('file_creation_date').notNull(),
  fileModificationDate: timestamp('file_modification_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  shootId: uuid('shoot_id').references(() => shootsTable.id, {
    onDelete: 'set null',
  }),
});

export const selectMediaSchema = createSelectSchema(mediaTable);
export const createMediaSchema = createInsertSchema(mediaTable).omit({
  createdAt: true,
});
export const updateMediaSchema = createUpdateSchema(mediaTable);

export type Media = z.infer<typeof selectMediaSchema>;
export type UpdateMedia = z.infer<typeof updateMediaSchema>;
export type CreateMedia = z.infer<typeof createMediaSchema>;
