export type AppError = Error & {
  readonly _tag: "AppError";
  readonly statusCode: number;
  readonly code: string;
};

const createAppError = (message: string, statusCode: number, code: string): AppError => {
  const error = new Error(message) as AppError;
  (error as { _tag: "AppError" })._tag = "AppError";
  (error as { statusCode: number }).statusCode = statusCode;
  (error as { code: string }).code = code;
  return error;
};

export const notFoundError = (message = "Not found") =>
  createAppError(message, 404, "NOT_FOUND");

export const validationError = (message: string) =>
  createAppError(message, 422, "VALIDATION_ERROR");

export const configurationError = (message: string) =>
  createAppError(message, 422, "CONFIGURATION_ERROR");

export const externalServiceError = (message: string) =>
  createAppError(message, 502, "EXTERNAL_SERVICE_ERROR");

export const conflictError = (message: string) =>
  createAppError(message, 409, "CONFLICT");

export const isAppError = (err: unknown): err is AppError =>
  err instanceof Error && (err as AppError)._tag === "AppError";
