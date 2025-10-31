import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: (string | undefined | null | false)[]): string =>
  twMerge(inputs.filter(Boolean).join(' '));

/**
 * Generates a client-side UUID for optimistic inserts.
 *
 * This UUID will be the permanent ID for the record - the server will use
 * the same ID when persisting to the database, enabling seamless optimistic
 * updates without ID reconciliation issues.
 *
 * @returns A v4 UUID string
 *
 * @example
 * ```typescript
 * shootsCollection.insert({
 *   id: generateTempId(),
 *   name: 'New Shoot',
 *   shootDate: new Date(),
 * })
 * ```
 */
export const generateTempId = (): string => crypto.randomUUID();
