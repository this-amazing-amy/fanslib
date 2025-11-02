import type { FetchAllMediaRequest, UpdateMediaRequest, FindAdjacentMediaRequest, ScanFileRequest } from "@fanslib/types";
import { Elysia } from 'elysia';
import { deleteMedia } from './operations/media/delete';
import { fetchAllMedia } from './operations/media/fetch-all';
import { getMediaById } from './operations/media/fetch-by-id';
import { findAdjacentMedia } from './operations/media/find-adjacent';
import { updateMedia } from './operations/media/update';
import { scanLibrary, scanFile, getScanStatus } from './operations/scan/scan';
import { loadSettings } from '../settings/operations/setting/load';

export const libraryRoutes = new Elysia({ prefix: '/api/media' })
  .get('/', async ({ query }) => {
    const request: FetchAllMediaRequest = {
      page: query.page ? parseInt(query.page as string) : undefined,
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      filters: query.filters ? JSON.parse(query.filters as string) : undefined,
      sort: query.sort ? JSON.parse(query.sort as string) : undefined,
    };
    return fetchAllMedia({
      page: request.page,
      limit: request.limit,
      filters: request.filters,
      sort: request.sort,
    });
  })
  .get('/:id', async ({ params: { id } }) => {
    const media = await getMediaById(id);
    if (!media) {
      return { error: 'Media not found' };
    }
    return media;
  })
  .patch('/:id', async ({ params: { id }, body }) => {
    const request = body as UpdateMediaRequest;
    const media = await updateMedia(id, request);
    if (!media) {
      return { error: 'Media not found' };
    }
    return media;
  })
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
    const settings = await loadSettings();
    await scanLibrary(settings.libraryPath);
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

