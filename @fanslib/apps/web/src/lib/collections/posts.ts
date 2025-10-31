import {
  selectPostSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const postsCollection = createCollection(
  electricCollectionOptions({
    id: 'posts',
    shapeOptions: {
      url: new URL(
        `/api/posts`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectPostSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newPost } = transaction.mutations[0];
      const result = await trpc.posts.create.mutate({
        ...newPost,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedPost } = transaction.mutations[0];
      const result = await trpc.posts.update.mutate({
        id: updatedPost.id,
        data: omit(updatedPost, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedPost } = transaction.mutations[0];
      const result = await trpc.posts.delete.mutate({
        id: deletedPost.id,
      });

      return { txid: result.txid };
    },
  })
);
