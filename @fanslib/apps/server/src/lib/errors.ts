export type AppError = {
  readonly _tag: 'AppError'
  readonly statusCode: number
  readonly message: string
  readonly code: string
}

export const notFoundError = (message = "Not found"): AppError => ({
  _tag: 'AppError',
  statusCode: 404,
  message,
  code: 'NOT_FOUND',
})

export const validationError = (message: string): AppError => ({
  _tag: 'AppError',
  statusCode: 422,
  message,
  code: 'VALIDATION_ERROR',
})

export const configurationError = (message: string): AppError => ({
  _tag: 'AppError',
  statusCode: 422,
  message,
  code: 'CONFIGURATION_ERROR',
})

export const externalServiceError = (message: string): AppError => ({
  _tag: 'AppError',
  statusCode: 502,
  message,
  code: 'EXTERNAL_SERVICE_ERROR',
})

export const conflictError = (message: string): AppError => ({
  _tag: 'AppError',
  statusCode: 409,
  message,
  code: 'CONFLICT',
})

export const isAppError = (err: unknown): err is AppError =>
  typeof err === 'object' && err !== null && (err as AppError)._tag === 'AppError'
