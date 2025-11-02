import { existsSync, mkdirSync } from "fs";
import { unlink, writeFile, readFile } from "fs/promises";
import { join } from "path";
import type { SessionStorage } from "./types";

const ensureDirectoryExists = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

export const createFileSessionStorage = (baseDir: string, username?: string): SessionStorage => {
  ensureDirectoryExists(baseDir);
  
  const sessionPath = join(baseDir, `session-${username ?? "default"}.json`);

  return {
    getPath: () => sessionPath,

    exists: async (): Promise<boolean> => existsSync(sessionPath),

    read: async (): Promise<string> => {
      if (!existsSync(sessionPath)) {
        throw new Error("Session file does not exist");
      }
      return readFile(sessionPath, "utf8");
    },

    write: async (data: string): Promise<void> => {
      await writeFile(sessionPath, data, "utf8");
    },

    clear: async (): Promise<void> => {
      if (existsSync(sessionPath)) {
        await unlink(sessionPath);
      }
    },
  };
};



