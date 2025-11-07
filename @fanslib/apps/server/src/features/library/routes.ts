import { type FindAdjacentMediaRequest, type ScanFileRequest, type UpdateMediaRequest } from "@fanslib/types";
import { Elysia } from 'elysia';
import { env } from '../../lib/env';
import { deleteMedia } from './operations/media/delete';
import { fetchAllMedia, FetchAllMediaRequestBodySchema, FetchAllMediaResponseSchema } from './operations/media/fetch-all';
import { getMediaById } from './operations/media/fetch-by-id';
import { findAdjacentMedia } from './operations/media/find-adjacent';
import { updateMedia } from './operations/media/update';
import { getScanStatus, scanFile, scanLibrary } from './operations/scan/scan';

export const libraryRoutes = new Elysia({ prefix: '/api/media' })
  .post('/', async ({ body }) => fetchAllMedia({
      page: body.page,
      limit: body.limit,
      filters: body.filters,
      sort: body.sort,
    }), {
    body: FetchAllMediaRequestBodySchema,
    response: FetchAllMediaResponseSchema,
  })
  .get('/:id', async ({ params: { id }, set }) => {
    const media = await getMediaById(id);
    if (!media) {
      set.status = 404;
      return { error: 'Media not found' };
    }

    return media;
  })
  .patch('/:id', async ({ params: { id }, body }) => {
    const request = body as UpdateMediaRequest;
    return updateMedia(id, request);
  } )
  .delete('/:id', async ({ params: { id }, query }) => {
    const deleteFile = query.deleteFile === 'true';
    await deleteMedia(id, deleteFile);
    return { success: true };
  })
  .get('/:id/adjacent', async ({ params: { id }, query }) => {
    const request: FindAdjacentMediaRequest = {
      filters: query.filters ? JSON.parse(query.filters as string) : undefined,
      sort: query.sort ? JSON.parse(query.sort as string) : undefined,
    };
    return findAdjacentMedia(id, {
      filters: request.filters,
      sort: request.sort,
    });
  })
  .post('/scan', async () => {
    await scanLibrary(env().libraryPath);
    return {
      message: 'Scan started',
      started: true,
    };
  })
  .post('/scan/file', async ({ body }) => {
    const request = body as ScanFileRequest;
    return scanFile(request.filePath);
  })
  .get('/scan/status', async () => getScanStatus());

