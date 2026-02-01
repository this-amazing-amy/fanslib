import type { Context } from "hono";
import { type ZodError } from "zod";

/**
 * Standard validation error handler for Zod validation failures.
 * Returns a 422 Unprocessable Entity response with error details.
 */
export const validationError = (result: ZodError, c: Context) => {
  const errors = result.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return c.json(
    {
      error: "Validation failed",
      details: errors,
    },
    422,
  );
};

/**
 * Standard 404 not found response helper.
 */
export const notFound = (c: Context, message: string) =>
  c.json({ error: message }, 404);

/**
 * Generic error response helper.
 */
export const errorResponse = (c: Context, status: number, message: string) =>
  c.json({ error: message }, status as never);
