import { promises as fs } from "fs";
import path from "path";

export type WalkOptions = {
  shouldEnter?: (relativeDir: string) => boolean;
};

const walk = async function* (
  root: string,
  current: string,
  shouldEnter: (relativeDir: string) => boolean,
): AsyncGenerator<string> {
  const entries = await fs.readdir(current, { withFileTypes: true });

  // eslint-disable-next-line functional/no-loop-statements
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(current, entry.name);

    if (entry.isDirectory()) {
      const relativeDir = path.relative(root, fullPath);
      if (!shouldEnter(relativeDir)) continue;
      yield* walk(root, fullPath, shouldEnter);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
};

export async function* walkDirectory(
  dir: string,
  options: WalkOptions = {},
): AsyncGenerator<string> {
  if (!dir || dir.trim() === "") {
    return;
  }

  try {
    const normalizedPath = path.resolve(dir);

    try {
      await fs.access(normalizedPath, fs.constants.R_OK);
    } catch (error) {
      console.warn(`Cannot access directory: ${normalizedPath}`, error);
      return;
    }

    const stats = await fs.stat(normalizedPath);
    if (!stats.isDirectory()) {
      console.warn(`Path is not a directory: ${normalizedPath}`);
      return;
    }

    yield* walk(normalizedPath, normalizedPath, options.shouldEnter ?? (() => true));
  } catch (error) {
    console.error(`Unexpected error walking directory ${dir}:`, error);
    throw error;
  }
}
