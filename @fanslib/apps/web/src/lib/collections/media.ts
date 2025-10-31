import {
    selectMediaSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { trpc } from '../trpc/client';


export const mediaCollection = createCollection(
  electricCollectionOptions({
    id: 'media',
    shapeOptions: {
      url: new URL(
        `/api/media`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectMediaSchema,
    getKey: (item) => item.id,
    onInsert: async () => {
      throw new Error('Creating media is not possible from the frontend.');
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedMedia } = transaction.mutations[0];
      const result = await trpc.media.update.mutate({
        id: updatedMedia.id,
        data: {
          ...updatedMedia,
        },
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedMedia } = transaction.mutations[0];
      const result = await trpc.media.delete.mutate({
        id: deletedMedia.id,
      });

      return { txid: result.txid };
    },
  })
);
