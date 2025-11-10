import { Elysia } from 'elysia';
import { DeleteMediaQuerySchema, DeleteMediaResponseSchema, deleteMedia } from './operations/media/delete';
import { FetchAllMediaRequestBodySchema, FetchAllMediaResponseSchema, fetchAllMedia } from './operations/media/fetch-all';
import { GetMediaByIdResponseSchema, getMediaById } from './operations/media/fetch-by-id';
import { FindAdjacentMediaBodySchema, FindAdjacentMediaResponseSchema, findAdjacentMedia } from './operations/media/find-adjacent';
import { UpdateMediaRequestBodySchema, UpdateMediaResponseSchema, updateMedia } from './operations/media/update';
import { FileScanResultSchema, ScanFileRequestBodySchema, ScanLibraryResponseSchema, ScanStatusResponseSchema, getScanStatus, scanFile, scanLibrary } from './operations/scan/scan';

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
  }, {
    response: GetMediaByIdResponseSchema,
  })
  .patch('/:id', async ({ params: { id }, body }) => 
    updateMedia(id, body), {
    body: UpdateMediaRequestBodySchema,
    response: UpdateMediaResponseSchema,
  })
  .delete('/:id', async ({ params: { id }, query }) => {
    const deleteFile = query.deleteFile === 'true';
    await deleteMedia(id, deleteFile);
    return { success: true };
  }, {
    query: DeleteMediaQuerySchema,
    response: DeleteMediaResponseSchema,
  })
  .get('/:id/adjacent', ({ params: { id }, body }) => findAdjacentMedia(id, body), {
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
  });

