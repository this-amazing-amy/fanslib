import * as devalue from "devalue";
import type { MiddlewareHandler } from "hono";

/**
 * Recursively converts class instances to plain objects and converts ISO date strings to Date objects.
 * This is necessary because:
 * 1. TypeORM returns class instances, not POJOs
 * 2. SQLite returns dates as ISO strings, but we want actual Date objects
 * 3. devalue.stringify can handle Date objects natively
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;

const toPlainObject = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (typeof value === "string" && ISO_DATE_REGEX.test(value)) {
    return new Date(value);
  }
  if (Array.isArray(value)) return value.map(toPlainObject);
  if (typeof value === "object") {
    const plain: Record<string, unknown> = {};
    Object.keys(value).forEach((key) => {
      plain[key] = toPlainObject((value as Record<string, unknown>)[key]);
    });
    return plain;
  }
  return value;
};

/**
 * Hono middleware that serializes JSON responses with devalue.
 * Skips serialization for swagger docs, file endpoints, and binary responses.
 */
export const devalueMiddleware = (): MiddlewareHandler => async (c, next) => {
  await next();

  const path = c.req.path;

  // Skip swagger docs
  if (path.match(/^\/api\/swagger(\/|$)/)) {
    return;
  }

  // Skip serialization for file serving endpoints (binary data)
  if (path.match(/\/file$/) || path.match(/\/thumbnail$/)) {
    return;
  }

  // Get the response
  const res = c.res;

  // Skip if not JSON content type or already has devalue header
  const contentType = res.headers.get("Content-Type");
  if (
    !contentType?.includes("application/json") ||
    res.headers.get("X-Serialization") === "devalue"
  ) {
    return;
  }

  // Parse the JSON body
  const body = await res.json();

  // Convert to plain object with Date handling
  const plainValue = toPlainObject(body);

  // Serialize with devalue
  const serialized = devalue.stringify(plainValue);

  // Replace the response
  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  c.res = new Response(serialized, {
    status: res.status,
    statusText: res.statusText,
    headers: {
      ...headersObj,
      "Content-Type": "application/json; charset=utf-8",
      "X-Serialization": "devalue",
    },
  });
};
