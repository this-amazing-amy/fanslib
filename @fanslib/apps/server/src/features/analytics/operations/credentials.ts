import { saveFanslyCredentials } from "../../settings/operations/credentials/save";

const parseFetchRequest = (fetchRequest: string): Partial<{
  fanslyAuth?: string;
  fanslySessionId?: string;
  fanslyClientCheck?: string;
  fanslyClientId?: string;
}> => {
  const credentials: Record<string, string> = {};

  try {
    const authMatch = fetchRequest.match(/"authorization":\s*"([^"]+)"/);
    if (authMatch?.[1]) {
      credentials.fanslyAuth = authMatch[1];
    }

    const sessionMatch = fetchRequest.match(/"fansly-session-id":\s*"([^"]+)"/);
    if (sessionMatch?.[1]) {
      credentials.fanslySessionId = sessionMatch[1];
    }

    const clientCheckMatch = fetchRequest.match(/"fansly-client-check":\s*"([^"]+)"/);
    if (clientCheckMatch?.[1]) {
      credentials.fanslyClientCheck = clientCheckMatch[1];
    }

    const clientIdMatch = fetchRequest.match(/"fansly-client-id":\s*"([^"]+)"/);
    if (clientIdMatch?.[1]) {
      credentials.fanslyClientId = clientIdMatch[1];
    }
  } catch (error) {
    console.error("Error parsing fetch request:", error);
  }

  return credentials;
};

export const updateFanslyCredentialsFromFetch = async (fetchRequest: string): Promise<void> => {
  const credentials = parseFetchRequest(fetchRequest);

  if (!credentials.fanslyAuth || !credentials.fanslySessionId) {
    throw new Error(
      "Could not extract required credentials from fetch request. Please ensure you copied a valid Fansly API request."
    );
  }

  await saveFanslyCredentials(credentials);
};



