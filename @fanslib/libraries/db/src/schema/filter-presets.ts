import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const filterPresetsTable = pgTable('filter_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  filters: jsonb('filters').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const selectFilterPresetSchema = createSelectSchema(filterPresetsTable);
export const createFilterPresetSchema = createInsertSchema(filterPresetsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateFilterPresetSchema = createUpdateSchema(filterPresetsTable);

export type FilterPreset = z.infer<typeof selectFilterPresetSchema>;
export type CreateFilterPreset = z.infer<typeof createFilterPresetSchema>;
export type UpdateFilterPreset = z.infer<typeof updateFilterPresetSchema>;
