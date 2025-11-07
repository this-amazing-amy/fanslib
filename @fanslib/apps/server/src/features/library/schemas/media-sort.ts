import { t } from "elysia";

export const SortFieldSchema = t.Union([
    t.Literal('fileModificationDate'),
    t.Literal('fileCreationDate'),
    t.Literal('lastPosted'),
    t.Literal('random'),
  ]);
  
  export const SortDirectionSchema = t.Union([t.Literal('ASC'), t.Literal('DESC')]);
  
  export const MediaSortSchema = t.Object({
    field: SortFieldSchema,
    direction: SortDirectionSchema,
  });