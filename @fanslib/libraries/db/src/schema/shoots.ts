import {
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createSchemaFactory } from 'drizzle-zod';
import { z } from 'zod/v4';

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({
    zodInstance: z,
  });

export const shootsTable = pgTable('shoots', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  shootDate: timestamp('shoot_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const selectShootSchema = createSelectSchema(shootsTable);
export const createShootSchema = createInsertSchema(shootsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const updateShootSchema = createUpdateSchema(shootsTable);

export type Shoot = z.infer<typeof selectShootSchema>;
export type UpdateShoot = z.infer<typeof updateShootSchema>;
export type CreateShoot = z.infer<typeof createShootSchema>;
