import {
  selectContentScheduleSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const schedulesCollection = createCollection(
  electricCollectionOptions({
    id: 'schedules',
    shapeOptions: {
      url: new URL(
        `/api/content-schedules`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectContentScheduleSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newSchedule } = transaction.mutations[0];
      const result = await trpc.schedules.create.mutate({
        ...newSchedule,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedSchedule } = transaction.mutations[0];
      const result = await trpc.schedules.update.mutate({
        id: updatedSchedule.id,
        data: omit(updatedSchedule, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedSchedule } = transaction.mutations[0];
      const result = await trpc.schedules.delete.mutate({
        id: deletedSchedule.id,
      });

      return { txid: result.txid };
    },
  })
);
