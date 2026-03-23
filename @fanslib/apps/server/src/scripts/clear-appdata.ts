import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const appdataPath = process.env.APPDATA_PATH;
if (!appdataPath || appdataPath.trim() === "") {
  console.error("APPDATA_PATH must be set (use the same value as when running the server).");
  process.exit(1);
}

const dbPath = join(appdataPath, "fanslib.sqlite");

if (!existsSync(dbPath)) {
  console.log(`No database file at ${dbPath} — nothing to remove.`);
  process.exit(0);
}

unlinkSync(dbPath);
console.log(`Removed ${dbPath}`);
console.log("Restart the server to create a fresh database.");
