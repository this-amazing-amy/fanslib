import { useState } from 'react';
import { eden } from '../lib/api';
import {
  isFileSystemAccessSupported,
  verifyDirectoryAccess,
  type VerificationResult,
} from '../lib/fileSystem';
import { DEFAULT_API_URL } from '../lib/storage';

type VerificationStatus = 'idle' | 'checking' | 'verified' | 'error';

type UseLibraryVerificationResult = {
  status: VerificationStatus;
  errorMessage: string;
  verifiedFolderName: string | null;
  verify: (apiUrl: string, currentPath: string) => Promise<string | null>;
};

const fetchSampleMediaPath = async (apiUrl: string): Promise<string> => {
  const api = eden(apiUrl);
  const response = await api.api.media.all.post(
    { page: 1, limit: 1 },
    { fetch: { signal: AbortSignal.timeout(5000) } }
  );

  if (response.error) {
    throw new Error(`API error: ${JSON.stringify(response.error)}`);
  }

  if (!response.data?.items?.length) {
    throw new Error(
      'No media found in library. Please ensure your library has been scanned.'
    );
  }

  const media = response.data.items[0];
  if (!media || typeof media !== 'object' || !('relativePath' in media)) {
    throw new Error('Invalid media data structure from API');
  }

  return String(media.relativePath);
};

const buildUpdatedPath = (
  currentPath: string,
  folderName: string
): string | null => {
  if (!currentPath) {
    return folderName;
  }

  if (currentPath.endsWith(folderName)) {
    return null;
  }

  const normalized = currentPath.replace(/\/$/, '');
  return `${normalized}/${folderName}`;
};

export const useLibraryVerification = (): UseLibraryVerificationResult => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedFolderName, setVerifiedFolderName] = useState<string | null>(
    null
  );

  const verify = async (
    apiUrl: string,
    currentPath: string
  ): Promise<string | null> => {
    if (!isFileSystemAccessSupported()) {
      setStatus('error');
      setErrorMessage(
        'File System Access API is not supported in this browser.'
      );
      return null;
    }

    setStatus('checking');
    setErrorMessage('');

    try {
      const urlToTest = apiUrl.trim() || DEFAULT_API_URL;
      const relativePath = await fetchSampleMediaPath(urlToTest);
      const result: VerificationResult =
        await verifyDirectoryAccess(relativePath);

      setVerifiedFolderName(result.folderName);
      setStatus('verified');

      return buildUpdatedPath(currentPath, result.folderName);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle');
        setErrorMessage('');
        return null;
      }

      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
      return null;
    }
  };

  return {
    status,
    errorMessage,
    verifiedFolderName,
    verify,
  };
};
