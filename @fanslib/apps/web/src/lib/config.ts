/**
 * Application configuration
 * Uses relative URLs — all API calls go through /api proxy
 */
const createConfig = () =>
  Object.freeze({
    baseUrl: '',
  });

/**
 * Validated application configuration
 */
export const config = createConfig();

/**
 * Backend API base URL
 * Empty string = relative URLs, proxied through /api on the web server
 *
 * @example
 * // All environments use relative URLs
 * fetch(`${backendBaseUrl}/api/media/123`)
 * // → /api/media/123 (proxied to API server)
 */
export const backendBaseUrl = config.baseUrl;
