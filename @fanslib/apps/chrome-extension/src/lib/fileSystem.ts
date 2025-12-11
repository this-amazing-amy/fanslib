export type VerificationResult = {
  folderName: string;
  fileName: string;
  fileSize: number;
};

export const parseRelativePath = (relativePath: string): string[] =>
  relativePath
    .replace(/\\/g, '/')
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean);

const navigateToDirectory = async (
  rootHandle: FileSystemDirectoryHandle,
  pathParts: string[]
): Promise<FileSystemDirectoryHandle> => {
  const directoryParts = pathParts.slice(0, -1);

  if (directoryParts.length === 0) {
    return rootHandle;
  }

  let currentHandle = rootHandle;

  for (const part of directoryParts) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(part);
    } catch (err) {
      const traversedPath = directoryParts.join('/');
      if (err instanceof Error && err.name === 'NotFoundError') {
        throw new Error(
          `Directory "${part}" not found.\nPath so far: "${traversedPath}"\nFull path: "${pathParts.join('/')}"`
        );
      }
      throw err;
    }
  }

  return currentHandle;
};

const verifyFileExists = async (
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<{ size: number }> => {
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return { size: file.size };
  } catch (err) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      throw new Error(
        `File "${fileName}" not found in "${directoryHandle.name}"`
      );
    }
    throw err;
  }
};

export const verifyDirectoryAccess = async (
  relativePath: string
): Promise<VerificationResult> => {
  const pathParts = parseRelativePath(relativePath);

  if (pathParts.length === 0) {
    throw new Error('Invalid media path: path is empty');
  }

  const fileName = pathParts[pathParts.length - 1];

  const rootHandle = await window.showDirectoryPicker({
    startIn: 'documents',
  });

  const targetDirectory = await navigateToDirectory(rootHandle, pathParts);
  const { size } = await verifyFileExists(targetDirectory, fileName);

  return {
    folderName: rootHandle.name,
    fileName: relativePath,
    fileSize: size,
  };
};

export const isFileSystemAccessSupported = (): boolean =>
  'showDirectoryPicker' in window;
