import { Schema as S } from "effect";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001';

// eslint-disable-next-line functional/no-classes
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    // eslint-disable-next-line functional/no-this-expressions
    this.name = 'APIError';
  }
}

export const apiRequest = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new APIError(
      errorData?.message ?? `API request failed: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
};

// Schema-aware API request that decodes the response
export const apiRequestWithSchema = async <A, I>(
  endpoint: string,
  schema: S.Schema<A, I, never>,
  options?: RequestInit
): Promise<A> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new APIError(
      errorData?.message ?? `API request failed: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  const jsonData = await response.json();

  // Decode the response using Effect Schema (converts date strings to Dates)
  return S.decodeSync(schema)(jsonData);
};

