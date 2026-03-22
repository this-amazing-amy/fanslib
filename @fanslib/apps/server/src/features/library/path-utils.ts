import { env } from "../../lib/env";

export const resolveMediaPath = (relativePath: string) => {
  const mediaPath = env().mediaPath;
  return `${mediaPath}/${relativePath}`;
};

export const convertRelativeToAbsolute = (relativePath: string) => resolveMediaPath(relativePath);
