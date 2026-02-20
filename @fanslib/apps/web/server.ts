import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Import the built server handler
//@ts-ignore
import server from './server/server.js';

const PORT = parseInt(process.env.PORT || '6969', 10);
const API_URL = process.env.API_URL || 'http://localhost:6970';
const CLIENT_DIR = join(import.meta.dir, 'client');

console.log('Starting production server...');
console.log('Client directory:', CLIENT_DIR);
console.log('Port:', PORT);

Bun.serve({
  port: PORT,
  fetch: async (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Proxy /api requests to the API server
    if (pathname.startsWith('/api')) {
      const apiPath = pathname.replace(/^\/api/, '');
      const apiUrl = `${API_URL}${apiPath}${url.search}`;
      const headers = new Headers(request.headers);
      headers.delete('host');
      
      const proxyResponse = await fetch(apiUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        // @ts-ignore - Bun supports duplex
        duplex: 'half',
      });
      
      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: proxyResponse.headers,
      });
    }

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
