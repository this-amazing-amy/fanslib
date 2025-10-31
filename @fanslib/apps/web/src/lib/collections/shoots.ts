import {
  shootCollectionSchema,
  type Shoot
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const shootsCollection = createCollection(
  electricCollectionOptions({
    id: 'shoots',
    shapeOptions: {
      url: new URL(
        `/api/shoots`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        // Parse timestamp columns into JavaScript Date objects
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: shootCollectionSchema,
    getKey: (item) => (item as Shoot).id,
    onInsert: async ({ transaction }) => {
      const { modified: newShoot } = transaction.mutations[0];
      const result = await trpc.shoots.create.mutate({
        ...newShoot,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedShoot } = transaction.mutations[0];
      if (!updatedShoot.id) throw new Error('Missing shoot id for update');
      const result = await trpc.shoots.update.mutate({
        id: updatedShoot.id,
        data: omit(updatedShoot, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedShoot } = transaction.mutations[0];
      if (!deletedShoot.id) throw new Error('Missing shoot id for update');
      const result = await trpc.shoots.delete.mutate({
        id: deletedShoot.id,
      });

      return { txid: result.txid };
    },
  })
);
