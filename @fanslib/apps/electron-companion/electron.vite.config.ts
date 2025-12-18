import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['clip-filepaths', 'clip-filepaths-win32-x64-msvc'],
      }),
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
});
