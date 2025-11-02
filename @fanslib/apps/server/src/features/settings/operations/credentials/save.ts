import type { FanslyCredentials } from "@fanslib/types";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { loadFanslyCredentials } from "./load";

const getDataDir = (): string => process.env.DATA_DIR ?? "./data";

const credentialsFilePath = (): string => join(getDataDir(), "fansly-credentials.json");

export const saveFanslyCredentials = async (
  credentials: Partial<FanslyCredentials>
): Promise<void> => {
  try {
    const existingCredentials = await loadFanslyCredentials();
    const updatedCredentials = { ...existingCredentials, ...credentials };

    await mkdir(dirname(credentialsFilePath()), { recursive: true });
    await writeFile(credentialsFilePath(), JSON.stringify(updatedCredentials, null, 2));
  } catch (error) {
    console.error("Error saving Fansly credentials:", error);
    throw error;
  }
};

