import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';
import { mediaTable } from './media';

export const tagDimensionsTable = pgTable('tag_dimensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  dataType: text('data_type', {
    enum: ['categorical', 'numerical', 'boolean'],
  }).notNull(),
  validationSchema: jsonb('validation_schema'),
  sortOrder: integer('sort_order').default(0),
  stickerDisplay: text('sticker_display', {
    enum: ['none', 'color', 'short'],
  }).default('none'),
  isExclusive: boolean('is_exclusive').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tagDefinitionsTable = pgTable('tag_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  dimensionId: uuid('dimension_id')
    .references(() => tagDimensionsTable.id)
    .notNull(),
  value: text('value').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  color: text('color'),
  shortRepresentation: text('short_representation'),
  sortOrder: integer('sort_order').default(0),
  parentTagId: uuid('parent_tag_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mediaTagsTable = pgTable(
  'media_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mediaId: uuid('media_id')
      .references(() => mediaTable.id, { onDelete: 'cascade' })
      .notNull(),
    tagDefinitionId: uuid('tag_definition_id')
      .references(() => tagDefinitionsTable.id)
      .notNull(),
    dimensionId: uuid('dimension_id').notNull(),
    dimensionName: text('dimension_name').notNull(),
    dataType: text('data_type').notNull(),
    tagValue: text('tag_value').notNull(),
    tagDisplayName: text('tag_display_name').notNull(),
    color: text('color'),
    stickerDisplay: text('sticker_display').default('none'),
    shortRepresentation: text('short_representation'),
    numericValue: real('numeric_value'),
    booleanValue: boolean('boolean_value'),
    confidence: real('confidence'),
    source: text('source', {
      enum: ['manual', 'automated', 'imported'],
    }).notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => ({
    dimensionTagIdx: index('media_tags_dimension_tag_idx').on(
      table.dimensionName,
      table.tagValue
    ),
    mediaDimensionIdx: index('media_tags_media_dimension_idx').on(
      table.mediaId,
      table.dimensionName
    ),
    dimensionNumericIdx: index('media_tags_dimension_numeric_idx').on(
      table.dimensionName,
      table.numericValue
    ),
  })
);

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

// Tag Dimensions Schemas
export const selectTagDimensionSchema = createSelectSchema(tagDimensionsTable);
export const createTagDimensionSchema = createInsertSchema(tagDimensionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateTagDimensionSchema = createUpdateSchema(tagDimensionsTable);

export type TagDimension = z.infer<typeof selectTagDimensionSchema>;
export type CreateTagDimension = z.infer<typeof createTagDimensionSchema>;
export type UpdateTagDimension = z.infer<typeof updateTagDimensionSchema>;

// Tag Definitions Schemas
export const selectTagDefinitionSchema = createSelectSchema(tagDefinitionsTable);
export const createTagDefinitionSchema = createInsertSchema(tagDefinitionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateTagDefinitionSchema = createUpdateSchema(tagDefinitionsTable);

export type TagDefinition = z.infer<typeof selectTagDefinitionSchema>;
export type CreateTagDefinition = z.infer<typeof createTagDefinitionSchema>;
export type UpdateTagDefinition = z.infer<typeof updateTagDefinitionSchema>;

// Media Tags Schemas
export const selectMediaTagSchema = createSelectSchema(mediaTagsTable);
export const createMediaTagSchema = createInsertSchema(mediaTagsTable).omit({
  assignedAt: true,
});

export type MediaTag = z.infer<typeof selectMediaTagSchema>;
export type CreateMediaTag = z.infer<typeof createMediaTagSchema>;

// Relations
export const tagDimensionsRelations = relations(tagDimensionsTable, ({ many }) => ({
  tagDefinitions: many(tagDefinitionsTable),
}));

export const tagDefinitionsRelations = relations(tagDefinitionsTable, ({ one, many }) => ({
  dimension: one(tagDimensionsTable, {
    fields: [tagDefinitionsTable.dimensionId],
    references: [tagDimensionsTable.id],
  }),
  parentTag: one(tagDefinitionsTable, {
    fields: [tagDefinitionsTable.parentTagId],
    references: [tagDefinitionsTable.id],
  }),
  childTags: many(tagDefinitionsTable),
  mediaTags: many(mediaTagsTable),
}));

export const mediaTagsRelations = relations(mediaTagsTable, ({ one }) => ({
  media: one(mediaTable, {
    fields: [mediaTagsTable.mediaId],
    references: [mediaTable.id],
  }),
  tagDefinition: one(tagDefinitionsTable, {
    fields: [mediaTagsTable.tagDefinitionId],
    references: [tagDefinitionsTable.id],
  }),
}));
