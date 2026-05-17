import path from "path";

export type ParsedShootFolder = {
  date: string;
  shortName: string;
};

const SHOOT_FOLDER_REGEX = /^(\d{4}-\d{2}-\d{2})_(.+)$/;
const CONTENT_DIR = "02_Content";

export const parseShootFolder = (name: string): ParsedShootFolder | null => {
  const match = SHOOT_FOLDER_REGEX.exec(name);
  if (!match) return null;
  const [, date, shortName] = match;
  if (!date || !shortName) return null;
  return { date, shortName };
};

/**
 * Allowlist predicate for the shoot-centric layout. Walk root is MEDIA_PATH = `.../Shoots`.
 *   "<date>_<name>"                → enter (it's a shoot)
 *   "<date>_<name>/02_Content"     → enter
 *   "<date>_<name>/02_Content/..." → enter (subfolders allowed)
 *   anything else                  → reject
 */
export const shouldEnterShootLayout = (relativeDir: string): boolean => {
  const [first, second, ...rest] = relativeDir.split(path.sep);
  if (first === undefined || first === "") return false;
  if (parseShootFolder(first) === null) return false;
  if (second === undefined) return true;
  if (second !== CONTENT_DIR) return false;
  return rest !== undefined;
};

/**
 * Given a relativePath under MEDIA_PATH = `.../Shoots`, return the parsed shoot
 * if the path is `<date>_<name>/02_Content/...`. Returns null otherwise.
 */
export const parseShootFromRelativePath = (relativePath: string): ParsedShootFolder | null => {
  const [first, second, ...rest] = relativePath.split(path.sep);
  if (first === undefined || second !== CONTENT_DIR || rest.length === 0) return null;
  return parseShootFolder(first);
};
