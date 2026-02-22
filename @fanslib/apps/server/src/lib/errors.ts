export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 422, "CONFIGURATION_ERROR");
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}
