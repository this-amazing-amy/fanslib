import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: ['clip-filepaths', 'clip-filepaths-win32-x64-msvc'],
      },
    },
  },
  preload: {},
});
