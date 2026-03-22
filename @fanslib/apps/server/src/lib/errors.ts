export class AppError extends Error {
  readonly _tag = "AppError" as const;
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFoundError = (message = "Not found") =>
  new AppError(message, 404, "NOT_FOUND");

export const validationError = (message: string) =>
  new AppError(message, 422, "VALIDATION_ERROR");

export const configurationError = (message: string) =>
  new AppError(message, 422, "CONFIGURATION_ERROR");

export const externalServiceError = (message: string) =>
  new AppError(message, 502, "EXTERNAL_SERVICE_ERROR");

export const conflictError = (message: string) =>
  new AppError(message, 409, "CONFLICT");

export const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError;
