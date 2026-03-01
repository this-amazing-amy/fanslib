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
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  environments: {
    // TanStack Start uses 'ssr' as the server environment name
    ssr: {
      resolve: {
        // Force these packages to be bundled into the server output
        // instead of left as external imports (fixes deploy on tsumetai)
        noExternal: ['h3-v2'],
        // Ensure single React instance for Zustand and other libs during SSR
        dedupe: ['react', 'react-dom', 'zustand'],
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 6969,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:6970',
      },
    },
  },
});
