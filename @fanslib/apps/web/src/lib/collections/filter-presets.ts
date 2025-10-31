import {
  selectFilterPresetSchema,
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const filterPresetsCollection = createCollection(
  electricCollectionOptions({
    id: 'filter-presets',
    shapeOptions: {
      url: new URL(
        `/api/filter-presets`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectFilterPresetSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newFilterPreset } = transaction.mutations[0];
      const result = await trpc.filterPresets.create.mutate({
        ...newFilterPreset,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedFilterPreset } = transaction.mutations[0];
      const result = await trpc.filterPresets.update.mutate({
        id: updatedFilterPreset.id,
        data: omit(updatedFilterPreset, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedFilterPreset } = transaction.mutations[0];
      const result = await trpc.filterPresets.delete.mutate({
        id: deletedFilterPreset.id,
      });

      return { txid: result.txid };
    },
  })
);
