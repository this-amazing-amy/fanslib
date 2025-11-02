import { unlink } from "fs/promises";
import { join } from "path";

const getDataDir = (): string => process.env.DATA_DIR ?? "./data";

const credentialsFilePath = (): string => join(getDataDir(), "fansly-credentials.json");

export const clearFanslyCredentials = async (): Promise<void> => {
  try {
    await unlink(credentialsFilePath());
  } catch {
    // File doesn't exist, which is fine
  }
};

