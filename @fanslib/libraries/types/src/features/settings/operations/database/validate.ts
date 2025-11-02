import type { ValidationResult } from "../../settings";

export type ValidateImportedDatabaseRequest = {
  libraryPath: string;
};

export type ValidateImportedDatabaseResponse = ValidationResult;

