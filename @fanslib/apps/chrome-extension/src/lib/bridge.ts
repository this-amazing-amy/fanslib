export type BridgeHealthResponse = {
  status: 'ok';
};

export type BridgeVerifyResponse = {
  exists: boolean;
  size: number;
  isFile: boolean;
};

export type BridgeCopyResponse = {
  success: boolean;
};

export type BridgeRevealResponse = {
  success: boolean;
};

export type BridgeErrorResponse = {
  error: string;
};

export const checkBridgeHealth = async (
  bridgeUrl: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${bridgeUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    });
    if (!response.ok) {
      return false;
    }
    const data: BridgeHealthResponse = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};

export const verifyFile = async (
  bridgeUrl: string,
  filePath: string
): Promise<BridgeVerifyResponse> => {
  const response = await fetch(`${bridgeUrl}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filePath }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const error: BridgeErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to verify file');
  }

  return response.json();
};

export const copyToClipboard = async (
  bridgeUrl: string,
  filePaths: string[]
): Promise<BridgeCopyResponse> => {
  const response = await fetch(`${bridgeUrl}/copy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filePaths }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const error: BridgeErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to copy to clipboard');
  }

  return response.json();
};

export const revealInFinder = async (
  bridgeUrl: string,
  filePath: string
): Promise<BridgeRevealResponse> => {
  const response = await fetch(`${bridgeUrl}/reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filePath }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    const error: BridgeErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to reveal file');
  }

  return response.json();
};
