import { Elysia, t } from 'elysia';
import { DeleteMediaQuerySchema, DeleteMediaRequestParamsSchema, DeleteMediaResponseSchema, deleteMedia } from './operations/media/delete';
import { FetchAllMediaRequestBodySchema, FetchAllMediaResponseSchema, fetchAllMedia } from './operations/media/fetch-all';
import { FetchMediaByIdRequestParamsSchema, FetchMediaByIdResponseSchema, fetchMediaById } from './operations/media/fetch-by-id';
import { FetchMediaByPathRequestParamsSchema, FetchMediaByPathResponseSchema, fetchMediaByPath } from './operations/media/fetch-by-path';
import { FindAdjacentMediaBodySchema, FindAdjacentMediaRequestParamsSchema, FindAdjacentMediaResponseSchema, findAdjacentMedia } from './operations/media/find-adjacent';
import { UpdateMediaRequestBodySchema, UpdateMediaRequestParamsSchema, UpdateMediaResponseSchema, updateMedia } from './operations/media/update';
import { FileScanResultSchema, ScanFileRequestBodySchema, ScanLibraryResponseSchema, ScanStatusResponseSchema, getScanStatus, scanFile, scanLibrary } from './operations/scan/scan';

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
  });

