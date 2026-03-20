import { readFile, writeFile } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const markCredentialsStale = async (): Promise<{ success: boolean }> => {
  try {
    const filePath = fanslyCredentialsFilePath();
    const data = await readFile(filePath, "utf8");
    const credentials = JSON.parse(data) as Record<string, unknown>;

    credentials._stale = true;

    await writeFile(filePath, JSON.stringify(credentials, null, 2));
    return { success: true };
  } catch {
    return { success: false };
  }
};
