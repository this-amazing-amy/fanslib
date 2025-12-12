import fs from 'fs';
import {
  createServer as createHttpServer,
  IncomingMessage,
  ServerResponse,
} from 'http';
import { URL } from 'url';
import { normalizeFilePath } from './paths';

type CopyHandler = (filePaths: string[]) => void;
type RevealHandler = (filePath: string) => void;

export const createServer = (onCopy: CopyHandler, onReveal: RevealHandler) => {
  return createHttpServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (url.pathname === '/verify' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { filePath } = JSON.parse(body);
          if (typeof filePath !== 'string') {
            throw new Error('filePath must be a string');
          }
          const normalizedPath = normalizeFilePath(filePath);
          const exists = fs.existsSync(normalizedPath);
          const stats = exists ? fs.statSync(normalizedPath) : null;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              exists,
              size: stats?.size || 0,
              isFile: stats?.isFile() || false,
            })
          );
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Invalid request',
            })
          );
        }
      });
      return;
    }

    if (url.pathname === '/copy' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { filePaths } = JSON.parse(body);
          if (!Array.isArray(filePaths)) {
            throw new Error('filePaths must be an array');
          }

          onCopy(filePaths);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          );
        }
      });
      return;
    }

    if (url.pathname === '/reveal' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { filePath } = JSON.parse(body);
          if (typeof filePath !== 'string') {
            throw new Error('filePath must be a string');
          }

          onReveal(normalizeFilePath(filePath));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          );
        }
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });
};
