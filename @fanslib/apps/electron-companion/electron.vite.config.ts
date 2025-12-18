import { defineConfig } from 'electron-vite';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: (id) => {
          // Externalize all dependencies except clip-filepaths
          return (
            !id.includes('clip-filepaths') &&
            (id.startsWith('node:') ||
              (!id.startsWith('.') && !id.startsWith('/')))
          );
        },
        plugins: [
          {
            name: 'copy-html',
            writeBundle() {
              const src = join(__dirname, 'src/main/status-window.html');
              const dest = join(__dirname, 'out/main/status-window.html');
              mkdirSync(dirname(dest), { recursive: true });
              copyFileSync(src, dest);
            },
          },
        ],
      },
    },
  },
  preload: {},
});
