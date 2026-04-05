/**
 * Server-side utility to flatten tracks into a flat array of operations.
 * Handles both the new track format and the legacy flat array format.
 */

type Track = {
  id: string;
  name: string;
  operations: unknown[];
};

/**
 * Given either a tracks array (new format) or a flat operations array (legacy),
 * returns a flat array of operations suitable for rendering.
 *
 * - If `tracks` is a non-empty array of track objects, flatten their operations.
 * - Otherwise fall back to the `operations` array (legacy format).
 */
export const flattenTracks = (
  tracks: unknown[] | null | undefined,
  operations: unknown[],
): unknown[] => {
  if (Array.isArray(tracks) && tracks.length > 0 && isTrackArray(tracks)) {
    return tracks.flatMap((t) => t.operations);
  }
  return operations;
};

const isTrackArray = (arr: unknown[]): arr is Track[] =>
  arr.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "name" in item &&
      "operations" in item &&
      Array.isArray((item as Track).operations),
  );
