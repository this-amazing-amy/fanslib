import type { DatabaseImportResult } from "../../settings";

export type ImportDatabaseRequest = {
  sourcePath: string;
};

export type ImportDatabaseResponse = DatabaseImportResult;

