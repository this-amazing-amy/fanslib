import type { DatabaseImportResult } from "@fanslib/types";
import { existsSync } from "fs";
import { copyFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { db, uninitialize } from "../../../../lib/db";
import { backupCurrentDatabase } from "./backup";

const getDbPath = (): string => process.env.SQLITE_DB_PATH ?? "./data/fanslib.sqlite";

export const importDatabase = async (sourcePath: string): Promise<DatabaseImportResult> => {
  try {
    if (!existsSync(sourcePath)) {
      return { success: false, error: "Source database file does not exist" };
    }

    await backupCurrentDatabase();
    await uninitialize();

    const dbPath = getDbPath();
    await mkdir(dirname(dbPath), { recursive: true });
    await copyFile(sourcePath, dbPath);
    await db();

    return { success: true };
  } catch (error) {
    console.error("Error importing database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

