export type VerificationResult = {
  folderName: string;
  fileName: string;
  fileSize: number;
};

type DirectoryPicker = (options?: {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?:
    | FileSystemHandle
    | FileSystemDirectoryHandle
    | FileSystemFileHandle
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos';
}) => Promise<FileSystemDirectoryHandle>;

type FileSystemWindow = Window &
  Partial<{
    showDirectoryPicker: DirectoryPicker;
  }>;

const selectRootDirectory = (): Promise<FileSystemDirectoryHandle> => {
  const picker = (window as FileSystemWindow).showDirectoryPicker;

  if (!picker) {
    throw new Error('File System Access API is unavailable');
  }

  return picker({ startIn: 'documents' });
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

  const traverse = async (
    directoryPromise: Promise<FileSystemDirectoryHandle>,
    part: string,
    index: number
  ): Promise<FileSystemDirectoryHandle> => {
    const currentHandle = await directoryPromise;

    try {
      return await currentHandle.getDirectoryHandle(part);
    } catch (err) {
      const traversedPath = directoryParts.slice(0, index + 1).join('/');
      if (err instanceof Error && err.name === 'NotFoundError') {
        throw new Error(
          `Directory "${part}" not found.\nPath so far: "${traversedPath}"\nFull path: "${pathParts.join('/')}"`
        );
      }
      throw err;
    }
  };

  return directoryParts.reduce(
    (directoryPromise, part, index) => traverse(directoryPromise, part, index),
    Promise.resolve(rootHandle)
  );
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

  const rootHandle = await selectRootDirectory();

  const targetDirectory = await navigateToDirectory(rootHandle, pathParts);
  const { size } = await verifyFileExists(targetDirectory, fileName);

  return {
    folderName: rootHandle.name,
    fileName: relativePath,
    fileSize: size,
  };
};

export const isFileSystemAccessSupported = (): boolean =>
  Boolean((window as FileSystemWindow).showDirectoryPicker);
