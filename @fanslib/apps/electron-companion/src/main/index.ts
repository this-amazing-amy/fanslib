import { app, clipboard, nativeImage, shell, Tray } from 'electron';
import fs from 'fs';
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
    const validFiles = filePaths.filter((filePath) => fs.existsSync(filePath));

    if (validFiles.length === 0) {
      throw new Error('No valid files to copy');
    }

    if (process.platform === 'darwin') {
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
${validFiles.map((f) => `  <string>${f}</string>`).join('\n')}
</array>
</plist>`;

      clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plistContent));
    } else {
      clipboard.writeText(validFiles.join('\n'));
    }
  };

  const handleRevealInFinder = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }
    shell.showItemInFolder(filePath);
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
