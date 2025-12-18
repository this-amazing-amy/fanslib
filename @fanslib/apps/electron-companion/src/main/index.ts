import { app, nativeImage, shell, Tray } from 'electron';
import fs from 'fs';
import { writeClipboardFilePaths } from 'clip-filepaths';
import { normalizeFilePath } from './paths';
import { createServer } from './server';

if (process.platform === 'darwin') {
  app.name = 'FansLib Companion';
}

let tray: Tray | null = null;

const createHeartIcon = (): Electron.NativeImage => {
  const size = 16;
  const bitmap = Buffer.alloc(size * size * 4);

  const heartShape = [
    '..####....####..',
    '.##############.',
    '################',
    '################',
    '################',
    '################',
    '.##############.',
    '..############..',
    '...##########...',
    '....########....',
    '.....######.....',
    '......####......',
    '.......##.......',
    '................',
    '................',
    '................',
  ];

  const color = { r: 255, g: 255, b: 255, a: 255 };

  heartShape.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const idx = (y * size + x) * 4;
      if (char === '#') {
        bitmap[idx] = color.r;
        bitmap[idx + 1] = color.g;
        bitmap[idx + 2] = color.b;
        bitmap[idx + 3] = color.a;
      } else {
        bitmap[idx] = 0;
        bitmap[idx + 1] = 0;
        bitmap[idx + 2] = 0;
        bitmap[idx + 3] = 0;
      }
    });
  });

  return nativeImage.createFromBuffer(bitmap, { width: size, height: size });
};

app.whenReady().then(async () => {
  const icon = createHeartIcon();

  tray = new Tray(icon);
  tray.setToolTip('FansLib Companion');

  const handleCopyToClipboard = (filePaths: string[]) => {
    const normalizedPaths = filePaths.map(normalizeFilePath);
    const validFiles = normalizedPaths.filter((filePath) =>
      fs.existsSync(filePath)
    );

    if (validFiles.length === 0) {
      throw new Error('No valid files to copy');
    }

    // Use clip-filepaths for cross-platform clipboard handling
    writeClipboardFilePaths(validFiles);
  };

  const handleRevealInFinder = (filePath: string) => {
    const normalizedPath = normalizeFilePath(filePath);

    if (!fs.existsSync(normalizedPath)) {
      throw new Error('File does not exist');
    }
    shell.showItemInFolder(normalizedPath);
  };

  const server = createServer(handleCopyToClipboard, handleRevealInFinder);

  const port = 6971;
  server.listen(port);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
