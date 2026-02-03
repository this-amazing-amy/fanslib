import { z } from "zod";

/**
 * Zod schema helper for parsing arrays from query strings.
 * Handles both:
 * - Comma-separated strings: "id1,id2,id3" -> ["id1", "id2", "id3"]
 * - Actual arrays (from some HTTP clients): ["id1", "id2"] -> ["id1", "id2"]
 * 
 * Use this for any endpoint that accepts an array as a query parameter.
 */
export const queryStringArray = z.union([
  z.array(z.string()),
  z.string().transform((val) => val.split(",")),
]);

/**
 * Zod schema helper for parsing number arrays from query strings.
 * Handles both:
 * - Comma-separated strings: "1,2,3" -> [1, 2, 3]
 * - Actual arrays: ["1", "2"] -> [1, 2]
 */
export const queryStringNumberArray = z.union([
  z.array(z.coerce.number()),
  z.string().transform((val) => val.split(",").map(Number)),
]);
