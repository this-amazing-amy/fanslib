import * as path from "path";

// Convert relative path to absolute path using media path
export const convertRelativeToAbsolute = (relativePath: string, mediaPath: string): string => {
  if (!relativePath) throw new Error("Relative path cannot be empty");
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.join(mediaPath, relativePath);
};
