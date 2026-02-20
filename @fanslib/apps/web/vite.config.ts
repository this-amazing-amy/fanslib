import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // nodePolyfills({
    //   // Don't polyfill stream since TanStack Router needs stream/web
    //   // which isn't available in stream-browserify
    //   exclude: ['stream'],
    // }),
  ],
  server: {
    host: '0.0.0.0',
    port: 6969,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:6970',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
