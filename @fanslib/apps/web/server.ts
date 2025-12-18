import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Import the built server handler
//@ts-ignore
import server from './dist/server/server.js';

const PORT = 6969;
const CLIENT_DIR = join(import.meta.dir, 'dist', 'client');

console.log('Starting production server...');
console.log('Client directory:', CLIENT_DIR);
console.log('Port:', PORT);

Bun.serve({
  port: PORT,
  fetch: async (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve static files from the client directory
    if (pathname.startsWith('/assets/') || pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|css|js|json|webmanifest)$/)) {
      const filePath = join(CLIENT_DIR, pathname);
      
      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        return new Response(file);
      }
    }

    // Otherwise, use the TanStack Start server handler
    return server.fetch(request);
  },
  error: (error) => {
    console.error('Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  },
});

console.log(`Server running at http://localhost:${PORT}`);
