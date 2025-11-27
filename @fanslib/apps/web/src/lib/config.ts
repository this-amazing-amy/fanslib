import { z } from 'zod';

/**
 * Environment variable validation schema for API URL
 * Requires a valid URL with protocol (e.g., http://localhost:6970)
 */
const apiUrlSchema = z.string()
  .min(1, 'VITE_API_URL cannot be empty')
  .url('VITE_API_URL must be a valid URL with protocol');

/**
 * Validates the API URL environment variable
 * @throws Error with descriptive message if validation fails
 */
const validateApiUrl = (url: unknown): string => {
  const result = apiUrlSchema.safeParse(url);

  if (!result.success) {
    const envValue = url ? String(url) : 'undefined';
    throw new Error(
      `Invalid or missing environment variable VITE_API_URL.\n` +
      `Expected a full URL with protocol (e.g., http://localhost:6970 for development, https://api.example.com for production).\n` +
      `Got: ${envValue}\n` +
      `Errors: ${result.error.issues.map(i => i.message).join(', ')}`
    );
  }

  return result.data;
};

/**
 * Creates the application configuration object
 * Validates environment variables at module load time
 */
const createConfig = () => {
  const baseUrl = validateApiUrl(import.meta.env.VITE_API_URL);

  return Object.freeze({
    baseUrl,
  });
};

/**
 * Validated application configuration
 * Contains validated environment variables
 */
export const config = createConfig();

/**
 * Backend API base URL (validated from VITE_API_URL)
 * Used for API client initialization and media URLs
 *
 * @example
 * // Development
 * backendBaseUrl = 'http://localhost:6970'
 *
 * @example
 * // Production
 * backendBaseUrl = 'https://api.example.com'
 */
export const backendBaseUrl = config.baseUrl;
