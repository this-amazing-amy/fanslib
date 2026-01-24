import * as devalue from "devalue";

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
  if (value instanceof Date) return value; // Already a Date, preserve it
  if (typeof value === "string" && ISO_DATE_REGEX.test(value)) {
    return new Date(value); // Convert ISO strings to Date objects
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

export const mapResponse = ({
  responseValue,
  path,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseValue: any;
  path: string;
}) => {
  // Skip swagger docs
  if (path.match(/^\/api\/swagger(\/|$)/)) {
    return responseValue;
  }

  // Skip serialization for file serving endpoints (binary data)
  if (path.match(/\/file$/) || path.match(/\/thumbnail$/)) {
    return responseValue;
  }

  // Skip serialization for Response objects (already formatted)
  if (responseValue instanceof Response) {
    return responseValue;
  }

  // Handle any object/array response (including TypeORM entities)
  if (responseValue !== null && typeof responseValue === "object") {
    // Convert class instances to plain objects, converting ISO date strings to Date objects
    const plainValue = toPlainObject(responseValue);
    const body = devalue.stringify(plainValue);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Serialization": "devalue",
      },
    });
  }

  return responseValue;
};
