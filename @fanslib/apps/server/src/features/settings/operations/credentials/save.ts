import type { FanslyCredentials } from "@fanslib/types";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { fanslyCredentialsFilePath } from "../../../../lib/env";
import { loadFanslyCredentials } from "./load";

export const saveFanslyCredentials = async (
  credentials: Partial<FanslyCredentials>
): Promise<void> => {
  try {
    const existingCredentials = await loadFanslyCredentials();
    const updatedCredentials = { ...existingCredentials, ...credentials };

    await mkdir(dirname(fanslyCredentialsFilePath()), { recursive: true });
    await writeFile(fanslyCredentialsFilePath(), JSON.stringify(updatedCredentials, null, 2));
  } catch (error) {
    console.error("Error saving Fansly credentials:", error);
    throw error;
  }
};

