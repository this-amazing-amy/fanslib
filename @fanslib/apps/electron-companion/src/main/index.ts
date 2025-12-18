import { app, BrowserWindow, nativeImage, screen, shell, Tray } from 'electron';
import fs from 'fs';
import path from 'path';
import { normalizeFilePath } from './paths';
import { createServer } from './server';

if (process.platform === 'darwin') {
  app.name = 'FansLib Companion';
}

let tray: Tray | null = null;
let statusWindow: BrowserWindow | null = null;

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

const createStatusWindow = () => {
  if (statusWindow && !statusWindow.isDestroyed()) {
    statusWindow.show();
    statusWindow.focus();
    return;
  }

  statusWindow = new BrowserWindow({
    width: 340,
    height: 280,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a1a',
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const htmlPath = path.join(__dirname, 'status-window.html');
  statusWindow.loadFile(htmlPath);

  statusWindow.once('ready-to-show', () => {
    if (statusWindow && !statusWindow.isDestroyed()) {
      if (tray) {
        const trayBounds = tray.getBounds();
        const windowBounds = statusWindow.getBounds();
        const primaryDisplay = screen.getPrimaryDisplay();
        const workArea = primaryDisplay.workArea;

        // Calculate x position (centered on tray icon)
        let x = Math.round(
          trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
        );

        // Calculate y position based on platform
        let y: number;

        if (process.platform === 'darwin') {
          // macOS: taskbar at top, position below tray
          y = Math.round(trayBounds.y + trayBounds.height + 4);
        } else if (process.platform === 'win32') {
          // Windows: taskbar typically at bottom, position above tray
          if (trayBounds.y > workArea.height / 2) {
            // Taskbar at bottom
            y = Math.round(trayBounds.y - windowBounds.height - 4);
          } else {
            // Taskbar at top
            y = Math.round(trayBounds.y + trayBounds.height + 4);
          }
        } else {
          // Linux: check taskbar position
          if (trayBounds.y > workArea.height / 2) {
            // Taskbar at bottom
            y = Math.round(trayBounds.y - windowBounds.height - 4);
          } else {
            // Taskbar at top
            y = Math.round(trayBounds.y + trayBounds.height + 4);
          }
        }

        // Ensure window stays within screen bounds
        x = Math.max(
          workArea.x,
          Math.min(x, workArea.x + workArea.width - windowBounds.width)
        );
        y = Math.max(
          workArea.y,
          Math.min(y, workArea.y + workArea.height - windowBounds.height)
        );

        statusWindow.setPosition(x, y);
      }
      statusWindow.show();
    }
  });

  statusWindow.on('blur', () => {
    if (statusWindow && !statusWindow.isDestroyed()) {
      statusWindow.hide();
    }
  });
};

app.whenReady().then(async () => {
  const icon = createHeartIcon();

  tray = new Tray(icon);
  tray.setToolTip('FansLib Companion');

  tray.on('click', () => {
    createStatusWindow();
  });

  const handleRevealInFinder = (filePath: string) => {
    const normalizedPath = normalizeFilePath(filePath);

    if (!fs.existsSync(normalizedPath)) {
      throw new Error('File does not exist');
    }
    shell.showItemInFolder(normalizedPath);
  };

  const server = createServer(handleRevealInFinder);

  const port = 6971;
  server.listen(port);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
