const COMPANION_BASE_URL = 'http://localhost:6971';

export type CompanionHealthResponse = {
  status: 'ok';
};

export type CompanionRevealResponse = {
  success: boolean;
};

export type CompanionErrorResponse = {
  error: string;
};

export const checkCompanionHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${COMPANION_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    });
    if (!response.ok) {
      return false;
    }
    const data: CompanionHealthResponse = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};

export const revealInFinder = async (
  filePath: string
): Promise<CompanionRevealResponse> => {
  const response = await fetch(`${COMPANION_BASE_URL}/reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filePath }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const error: CompanionErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to reveal file');
  }

  return response.json();
};

