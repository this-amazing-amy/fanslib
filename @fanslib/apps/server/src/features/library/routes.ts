import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { validationError, notFound } from '../../lib/hono-utils';
import { deleteMedia } from './operations/media/delete';
import { fetchAllMedia } from './operations/media/fetch-all';
import { fetchMediaById } from './operations/media/fetch-by-id';
import { fetchMediaByPath } from './operations/media/fetch-by-path';
import { findAdjacentMedia } from './operations/media/find-adjacent';
import { updateMedia } from './operations/media/update';
import { getMediaPostingHistory } from './operations/media/get-media-posting-history';
import { getScanStatus, scanFile, scanLibrary } from './operations/scan/scan';
import { getThumbnailPath } from './operations/scan/thumbnail';
import { resolveMediaPath } from './path-utils';
import { MediaFilterSchema } from './schemas/media-filter';
import { MediaSortSchema } from './schemas/media-sort';
import { MediaTypeSchema } from './schema';

// Zod Schemas for request/response validation
const FetchAllMediaRequestBodySchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(50),
  filters: MediaFilterSchema.optional(),
  sort: MediaSortSchema.optional(),
  excludeMediaIds: z.array(z.string()).optional(),
  channelId: z.string().optional(),
  applyRepostCooldown: z.boolean().optional(),
});

const DeleteMediaQuerySchema = z.object({
  deleteFile: z.string().optional(),
});

const UpdateMediaRequestBodySchema = z.object({
  relativePath: z.string().optional(),
  type: MediaTypeSchema.optional(),
  name: z.string().optional(),
  size: z.number().optional(),
  duration: z.number().optional(),
  redgifsUrl: z.string().nullable().optional(),
  fileCreationDate: z.coerce.date().optional(),
  fileModificationDate: z.coerce.date().optional(),
});

const FindAdjacentMediaBodySchema = z.object({
  filters: MediaFilterSchema.optional(),
  sort: MediaSortSchema.optional(),
});

const ScanFileRequestBodySchema = z.object({
  filePath: z.string(),
});

const getMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
  };
  return mimeTypes[ext] ?? 'application/octet-stream';
};

type ParsedRange = {
  start: number;
  end: number;
};

const parseRangeHeader = (rangeHeader: string | null, fileSize: number): ParsedRange | null => {
  if (!rangeHeader) return null;

  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  // Validate range
  if (start >= fileSize || start > end || end >= fileSize) {
    return null;
  }

  return { start, end };
};

export const libraryRoutes = new Hono()
  .basePath('/api/media')
  .post('/all', zValidator('json', FetchAllMediaRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid('json');
    const result = await fetchAllMedia({
      page: body.page,
      limit: body.limit,
      filters: body.filters,
      sort: body.sort,
      excludeMediaIds: body.excludeMediaIds,
      channelId: body.channelId,
      applyRepostCooldown: body.applyRepostCooldown,
    });
    return c.json(result);
  })
  .get('/by-id/:id', async (c) => {
    const id = c.req.param('id');
    const media = await fetchMediaById(id);
    if (!media) {
      return notFound(c, 'Media not found');
    }
    return c.json(media);
  })
  .get('/by-path/:path', async (c) => {
    const path = c.req.param('path');
    const media = await fetchMediaByPath(path);
    if (!media) {
      return notFound(c, 'Media not found');
    }
    return c.json(media);
  })
  .patch('/by-id/:id', zValidator('json', UpdateMediaRequestBodySchema, validationError), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const media = await updateMedia(id, body);
    if (!media) {
      return notFound(c, 'Media not found');
    }
    return c.json(media);
  })
  .delete('/by-id/:id', zValidator('query', DeleteMediaQuerySchema, validationError), async (c) => {
    const id = c.req.param('id');
    const query = c.req.valid('query');
    const deleteFile = query.deleteFile === 'true';
    const success = await deleteMedia(id, deleteFile);
    if (!success) {
      return notFound(c, 'Media not found');
    }
    return c.json({ success: true });
  })
  .post('/by-id/:id/adjacent', zValidator('json', FindAdjacentMediaBodySchema, validationError), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const result = await findAdjacentMedia(id, body);
    return c.json(result);
  })
  .get('/by-id/:id/posting-history', async (c) => {
    const id = c.req.param('id');
    const result = await getMediaPostingHistory(id);
    return c.json(result);
  })
  .post('/scan', async (c) => {
    await scanLibrary();
    return c.json({
      message: 'Scan started',
      started: true,
    });
  })
  .post('/scan/file', zValidator('json', ScanFileRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid('json');
    const result = await scanFile(body.filePath);
    return c.json(result);
  })
  .get('/scan/status', async (c) => {
    const result = await getScanStatus();
    return c.json(result);
  })
  .get('/:id/file', async (c) => {
    const id = c.req.param('id');
    const media = await fetchMediaById(id);
    if (!media) {
      return c.json({ error: 'Media not found' }, 404);
    }

    const filePath = resolveMediaPath(media.relativePath);

    try {
      await fs.access(filePath);
    } catch {
      return c.json({ error: 'File not found' }, 404);
    }

    const file = Bun.file(filePath);
    const mimeType = getMimeType(filePath);
    const fileSize = file.size;
    
    // Check for Range header
    const rangeHeader = c.req.header('Range');
    const range = parseRangeHeader(rangeHeader ?? null, fileSize);

    // If no range or invalid range, serve the full file
    if (!range) {
      return c.body(file.stream(), 200, {
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
      });
    }

    // Serve partial content
    const { start, end } = range;
    const chunkSize = end - start + 1;

    return c.body(file.slice(start, end + 1).stream(), 206, {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize.toString(),
    });
  })
  .get('/:id/thumbnail', async (c) => {
    const id = c.req.param('id');
    const thumbnailPath = getThumbnailPath(id);
    
    try {
      await fs.access(thumbnailPath);
    } catch {
      return c.json({ error: 'Thumbnail not found' }, 404);
    }

    const file = Bun.file(thumbnailPath);
    
    return c.body(file.stream(), 200, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    });
  });

