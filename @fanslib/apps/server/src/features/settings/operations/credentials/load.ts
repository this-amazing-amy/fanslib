import type { FanslyCredentials } from "@fanslib/types";
import { readFile } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const loadFanslyCredentials = async (): Promise<FanslyCredentials> => {
  try {
    const data = await readFile(fanslyCredentialsFilePath(), "utf8");
    return JSON.parse(data) as FanslyCredentials;
  } catch {
    return {};
  }
};

