const BRIDGE_URL = 'http://localhost:6971';

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

export const checkBridgeHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/health`, {
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
  filePath: string
): Promise<BridgeVerifyResponse> => {
  const response = await fetch(`${BRIDGE_URL}/verify`, {
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
  filePaths: string[]
): Promise<BridgeCopyResponse> => {
  const response = await fetch(`${BRIDGE_URL}/copy`, {
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
  filePath: string
): Promise<BridgeRevealResponse> => {
  const response = await fetch(`${BRIDGE_URL}/reveal`, {
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
