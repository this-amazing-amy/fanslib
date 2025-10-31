import {
    selectSnippetSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';


export const snippetsCollection = createCollection(
  electricCollectionOptions({
    id: 'snippets',
    shapeOptions: {
      url: new URL(
        `/api/snippets`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectSnippetSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newSnippet } = transaction.mutations[0];
      const result = await trpc.snippets.create.mutate({
        ...newSnippet,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedSnippet } = transaction.mutations[0];
      const result = await trpc.snippets.update.mutate({
        id: updatedSnippet.id,
        data: omit(updatedSnippet, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedSnippet } = transaction.mutations[0];
      const result = await trpc.snippets.delete.mutate({
        id: deletedSnippet.id,
      });

      return { txid: result.txid };
    },
  })
);
