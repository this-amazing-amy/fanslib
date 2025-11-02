import type { DatabaseImportResult } from "@fanslib/types";
import { existsSync } from "fs";
import { copyFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { db, uninitialize } from "../../../../lib/db";
import { sqliteDbPath } from "../../../../lib/env";
import { backupCurrentDatabase } from "./backup";


export const importDatabase = async (sourcePath: string): Promise<DatabaseImportResult> => {
  try {
    if (!existsSync(sourcePath)) {
      return { success: false, error: "Source database file does not exist" };
    }

    await backupCurrentDatabase();
    await uninitialize();

    await mkdir(dirname(sqliteDbPath()), { recursive: true });
    await copyFile(sourcePath, sqliteDbPath());
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

