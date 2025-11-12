import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { dirname } from "path";


const ensureDir = async (dirPath: string) => {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
};

const cwd = process.cwd();
process.env.PORT = process.env.PORT ?? "8001";
process.env.APPDATA_PATH = process.env.APPDATA_PATH ?? `${cwd}/.test-data/appdata`;
process.env.LIBRARY_PATH = process.env.LIBRARY_PATH ?? `${cwd}/.test-data/library`;

await ensureDir(process.env.APPDATA_PATH);
await ensureDir(process.env.LIBRARY_PATH);
// Also ensure sqlite dir exists if db path nests
await ensureDir(dirname(`${process.env.APPDATA_PATH}/fanslib.sqlite`));


