import type { Context } from "hono";
import type { ZodError } from "zod";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError; data: T };

/**
 * Standard validation error handler for Zod validation failures.
 * Returns a 422 Unprocessable Entity response with error details.
 */
export const validationError = <T>(result: ValidationResult<T> & { target: string }, c: Context) => {
  if (result.success) return;

  const errors = result.error.issues.map((err) => ({
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
