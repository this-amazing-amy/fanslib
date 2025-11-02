import { env } from "../../lib/env";

export const resolveMediaPath = (relativePath: string) => {
  const libraryPath = env().libraryPath;
  return `${libraryPath}/${relativePath}`;
};

export const convertRelativeToAbsolute = (relativePath: string) => resolveMediaPath(relativePath);

