import { promises as fs } from "fs";
import path from "path";
import { env } from "../../../../lib/env";
import { TUS_STAGING_SUBDIR } from "../../tus-server";

const STAGING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const unlinkIfStale = async (filePath: string, cutoffMs: number) => {
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) return;
  if (stats.mtimeMs >= cutoffMs) return;
  await fs.unlink(filePath);
};

export const cleanAbandonedTusStaging = async (): Promise<void> => {
  const stagingDir = path.join(env().mediaPath, TUS_STAGING_SUBDIR);
  const cutoffMs = Date.now() - STAGING_MAX_AGE_MS;

  const entries = await fs.readdir(stagingDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [] as string[];
    throw error;
  });

  await Promise.all(
    entries.map((entry) =>
      unlinkIfStale(path.join(stagingDir, entry), cutoffMs).catch((error) => {
        console.error(`Failed to clean abandoned tus file ${entry}:`, error);
      }),
    ),
  );
};
