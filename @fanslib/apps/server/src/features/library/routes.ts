import { Elysia, t } from 'elysia';
import { promises as fs } from 'fs';
import path from 'path';
import { DeleteMediaQuerySchema, DeleteMediaRequestParamsSchema, DeleteMediaResponseSchema, deleteMedia } from './operations/media/delete';
import { FetchAllMediaRequestBodySchema, FetchAllMediaResponseSchema, fetchAllMedia } from './operations/media/fetch-all';
import { FetchMediaByIdRequestParamsSchema, FetchMediaByIdResponseSchema, fetchMediaById } from './operations/media/fetch-by-id';
import { FetchMediaByPathRequestParamsSchema, FetchMediaByPathResponseSchema, fetchMediaByPath } from './operations/media/fetch-by-path';
import { FindAdjacentMediaBodySchema, FindAdjacentMediaRequestParamsSchema, FindAdjacentMediaResponseSchema, findAdjacentMedia } from './operations/media/find-adjacent';
import { UpdateMediaRequestBodySchema, UpdateMediaRequestParamsSchema, UpdateMediaResponseSchema, updateMedia } from './operations/media/update';
import { FileScanResultSchema, ScanFileRequestBodySchema, ScanLibraryResponseSchema, ScanStatusResponseSchema, getScanStatus, scanFile, scanLibrary } from './operations/scan/scan';
import { getThumbnailPath } from './operations/scan/thumbnail';
import { resolveMediaPath } from './path-utils';

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

export const libraryRoutes = new Elysia({ prefix: '/api/media' })
  .post('/all', async ({ body }) => fetchAllMedia({
      page: body.page,
      limit: body.limit,
      filters: body.filters,
      sort: body.sort,
    }), {
    body: FetchAllMediaRequestBodySchema,
    response: FetchAllMediaResponseSchema,
  })
  .get('/by-id/:id', async ({ params: { id }, set }) => {
    const media = await fetchMediaById(id);
    if (!media) {
      set.status = 404;
      return { error: 'Media not found' };
    }

    return media;
  }, {
    params: FetchMediaByIdRequestParamsSchema,
    response: {
      200: FetchMediaByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    }
  })
  .get('/by-path/:path', async ({ params: { path }, set }) => {
    const media = await fetchMediaByPath(path);
    if (!media) {
      set.status = 404;
      return { error: 'Media not found' };
    }
    return media;
  }, {
    params: FetchMediaByPathRequestParamsSchema,
    response: {
      200: FetchMediaByPathResponseSchema,
      404: t.Object({ error: t.String() }),
    }
  })
    .patch('/by-id/:id', async ({ params: { id }, body, set }) => {
      const media = await updateMedia(id, body);
      if (!media) {
        set.status = 404;
        return { error: 'Media not found' };
      }
      return media;
    },{
    params: UpdateMediaRequestParamsSchema,
    body: UpdateMediaRequestBodySchema,
    response: {
      200: UpdateMediaResponseSchema,
      404: t.Object({ error: t.String() }),
    }
  })
  .delete('/by-id/:id', async ({ params: { id }, query, set }) => {
    const deleteFile = query.deleteFile === 'true';
    const success = await deleteMedia(id, deleteFile);
    if (!success) {
      set.status = 404;
      return { error: 'Media not found' };
    }
    return { success: true };
  }, {
    params: DeleteMediaRequestParamsSchema,
    query: DeleteMediaQuerySchema,
    response: {
      200: DeleteMediaResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post('/by-id/:id/adjacent', async ({ params: { id }, body }) => findAdjacentMedia(id, body), {
    params: FindAdjacentMediaRequestParamsSchema,
    body: FindAdjacentMediaBodySchema,
    response: FindAdjacentMediaResponseSchema,
  })
  .post('/scan', async () => {
    await scanLibrary();
    return {
      message: 'Scan started',
      started: true,
    };
  }, {
    response: ScanLibraryResponseSchema,
  })
  .post('/scan/file', async ({ body }) => scanFile(body.filePath), {
    body: ScanFileRequestBodySchema,
    response: FileScanResultSchema,
  })
  .get('/scan/status', async () => getScanStatus(), {
    response: ScanStatusResponseSchema,
  })
  .get('/:id/file', async ({ params: { id }, set }) => {
    const media = await fetchMediaById(id);
    if (!media) {
      set.status = 404;
      return { error: 'Media not found' };
    }

    const filePath = resolveMediaPath(media.relativePath);

    try {
      await fs.access(filePath);
    } catch {
      set.status = 404;
      return { error: 'File not found' };
    }

    const file = Bun.file(filePath);
    const mimeType = getMimeType(filePath);
    
    set.headers['Content-Type'] = mimeType;
    
    return file;
  }, {
    params: FetchMediaByIdRequestParamsSchema,
    response: {
      200: t.Any(),
      404: t.Object({ error: t.String() }),
    },
  })
  .get('/:id/thumbnail', async ({ params: { id }, set }) => {
    const thumbnailPath = getThumbnailPath(id);
    
    try {
      await fs.access(thumbnailPath);
    } catch {
      set.status = 404;
      return { error: 'Thumbnail not found' };
    }

    const file = Bun.file(thumbnailPath);
    
    set.headers['Content-Type'] = 'image/jpeg';
    set.headers['Cache-Control'] = 'public, max-age=31536000';
    
    return file;
  }, {
    params: FetchMediaByIdRequestParamsSchema,
    response: {
      200: t.Any(),
      404: t.Object({ error: t.String() }),
    },
  });

