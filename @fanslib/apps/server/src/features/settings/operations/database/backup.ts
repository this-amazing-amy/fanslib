import { existsSync } from "fs";
import { copyFile } from "fs/promises";

const getDbPath = (): string => process.env.SQLITE_DB_PATH ?? "./data/fanslib.sqlite";

const getBackupPath = (): string => `${getDbPath()}.backup`;

export const backupCurrentDatabase = async (): Promise<void> => {
  const dbPath = getDbPath();
  if (existsSync(dbPath)) {
    await copyFile(dbPath, getBackupPath());
  }
};

