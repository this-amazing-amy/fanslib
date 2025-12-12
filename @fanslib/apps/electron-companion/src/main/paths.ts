import path from 'path';
import { fileURLToPath } from 'url';

const isFileUrl = (value: string) => value.startsWith('file://');

export const normalizeFilePath = (rawPath: string): string => {
  const filePath = isFileUrl(rawPath) ? fileURLToPath(rawPath) : rawPath;

  if (process.platform !== 'win32') {
    return filePath;
  }

  const windowsSlashes = filePath.replace(/\//g, '\\');
  return path.win32.normalize(windowsSlashes);
};
