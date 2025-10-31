import {
  selectChannelSchema, selectSubredditSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const channelsCollection = createCollection(
  electricCollectionOptions({
    id: 'channels',
    shapeOptions: {
      url: new URL(
        `/api/channels`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectChannelSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newChannel } = transaction.mutations[0];
      const result = await trpc.channels.create.mutate({
        ...newChannel,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedChannel } = transaction.mutations[0];
      const result = await trpc.channels.update.mutate({
        id: updatedChannel.id,
        data: omit(updatedChannel, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedChannel } = transaction.mutations[0];
      const result = await trpc.channels.delete.mutate({
        id: deletedChannel.id,
      });

      return { txid: result.txid };
    },
  })
);

export const subredditsCollection = createCollection(
  electricCollectionOptions({
    id: 'subreddits',
    shapeOptions: {
      url: new URL(
        `/api/subreddits`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectSubredditSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newSubreddit } = transaction.mutations[0];
      const result = await trpc.subreddits.create.mutate({
        ...newSubreddit,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedSubreddit } = transaction.mutations[0];
      const result = await trpc.subreddits.update.mutate({
        id: updatedSubreddit.id,
        data: omit(updatedSubreddit, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedSubreddit } = transaction.mutations[0];
      const result = await trpc.subreddits.delete.mutate({
        id: deletedSubreddit.id,
      });

      return { txid: result.txid };
    },
  })
);
