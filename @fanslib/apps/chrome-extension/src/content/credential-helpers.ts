export type FanslyCredentials = {
  fanslyAuth?: string;
  fanslySessionId?: string;
  fanslyClientCheck?: string;
  fanslyClientId?: string;
};

export const extractCredentialsFromHeaders = (
  headers: HeadersInit | undefined,
): Partial<FanslyCredentials> => {
  const credentials: Partial<FanslyCredentials> = {};

  if (!headers) return credentials;

  const headerMap: Record<string, string> = (() => {
    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }
    return headers as Record<string, string>;
  })();

  const getHeader = (name: string): string | undefined => {
    const lowerName = name.toLowerCase();
    const entry = Object.entries(headerMap).find(([key]) => key.toLowerCase() === lowerName);
    return entry ? String(entry[1]) : undefined;
  };

  const auth = getHeader("authorization");
  if (auth) credentials.fanslyAuth = auth;

  const sessionId = getHeader("fansly-session-id");
  if (sessionId) credentials.fanslySessionId = sessionId;

  const clientCheck = getHeader("fansly-client-check");
  if (clientCheck) credentials.fanslyClientCheck = clientCheck;

  const clientId = getHeader("fansly-client-id");
  if (clientId) credentials.fanslyClientId = clientId;

  return credentials;
};

export const sendCredentialsIfPresent = (credentials: Partial<FanslyCredentials>): void => {
  const hasCredentials = Object.keys(credentials).length > 0;

  if (hasCredentials) {
    window.postMessage(
      {
        type: "FANSLIB_CREDENTIALS",
        credentials,
      },
      "*",
    );
  }
};
