import { existsSync } from "fs";
import { copyFile } from "fs/promises";
import { sqliteDbPath } from "../../../../lib/env";

const getBackupPath = (): string => `${sqliteDbPath()}.backup`;

export const backupCurrentDatabase = async (): Promise<void> => {
  if (existsSync(sqliteDbPath())) {
    await copyFile(sqliteDbPath(), getBackupPath());
  }
};
