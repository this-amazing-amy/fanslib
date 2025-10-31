import {
  selectHashtagSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const hashtagsCollection = createCollection(
  electricCollectionOptions({
    id: 'hashtags',
    shapeOptions: {
      url: new URL(
        `/api/hashtags`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectHashtagSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newHashtag } = transaction.mutations[0];
      const result = await trpc.hashtags.create.mutate({
        ...newHashtag,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedHashtag } = transaction.mutations[0];
      const result = await trpc.hashtags.update.mutate({
        id: updatedHashtag.id,
        data: omit(updatedHashtag, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedHashtag } = transaction.mutations[0];
      const result = await trpc.hashtags.delete.mutate({
        id: deletedHashtag.id,
      });

      return { txid: result.txid };
    },
  })
);
