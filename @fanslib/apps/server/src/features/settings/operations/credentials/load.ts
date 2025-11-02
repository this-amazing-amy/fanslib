import type { FanslyCredentials } from "@fanslib/types";
import { readFile } from "fs/promises";
import { join } from "path";

const getDataDir = (): string => process.env.DATA_DIR ?? "./data";

const credentialsFilePath = (): string => join(getDataDir(), "fansly-credentials.json");

export const loadFanslyCredentials = async (): Promise<FanslyCredentials> => {
  try {
    const data = await readFile(credentialsFilePath(), "utf8");
    return JSON.parse(data) as FanslyCredentials;
  } catch {
    return {};
  }
};

