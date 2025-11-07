import { Schema } from "effect";
import type { StandardSchemaV1Like } from "elysia/types";

export const responseSchema = <A, I>(schema: Schema.Schema<A, I,never>): StandardSchemaV1Like => 
  Schema.standardSchemaV1(Schema.asSchema(schema));