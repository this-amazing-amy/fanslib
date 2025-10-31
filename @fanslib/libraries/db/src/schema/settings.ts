import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import z from 'zod/v4';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });


export const settingsTable = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const selectSettingsSchema = createSelectSchema(settingsTable);
export const createSettingsSchema = createInsertSchema(settingsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateSettingsSchema = createUpdateSchema(settingsTable);
