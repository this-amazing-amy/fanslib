import { unlink } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const clearFanslyCredentials = async (): Promise<void> => {
  try {
    await unlink(fanslyCredentialsFilePath());
  } catch {
    // File doesn't exist, which is fine
  }
};

