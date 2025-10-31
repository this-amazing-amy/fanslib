import {
  mediaTagCollectionSchema, selectTagDefinitionSchema, selectTagDimensionSchema
} from '@fanslib/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { omit } from 'remeda';
import { trpc } from '../trpc/client';

export const tagDimensionsCollection = createCollection(
  electricCollectionOptions({
    id: 'tag-dimensions',
    shapeOptions: {
      url: new URL(
        `/api/tag-dimensions`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectTagDimensionSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newTagDimension } = transaction.mutations[0];
      const result = await trpc.tagDimensions.create.mutate({
        ...newTagDimension,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedTagDimension } = transaction.mutations[0];
      const result = await trpc.tagDimensions.update.mutate({
        id: updatedTagDimension.id,
        data: omit(updatedTagDimension, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedTagDimension } = transaction.mutations[0];
      const result = await trpc.tagDimensions.delete.mutate({
        id: deletedTagDimension.id,
      });

      return { txid: result.txid };
    },
  })
);

export const tagDefinitionsCollection = createCollection(
  electricCollectionOptions({
    id: 'tag-definitions',
    shapeOptions: {
      url: new URL(
        `/api/tag-definitions`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: selectTagDefinitionSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newTagDefinition } = transaction.mutations[0];
      const result = await trpc.tagDefinitions.create.mutate({
        ...newTagDefinition,
      });

      return { txid: result.txid };
    },
    onUpdate: async ({ transaction }) => {
      const { modified: updatedTagDefinition } = transaction.mutations[0];
      const result = await trpc.tagDefinitions.update.mutate({
        id: updatedTagDefinition.id,
        data: omit(updatedTagDefinition, ['id']),
      });

      return { txid: result.txid };
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedTagDefinition } = transaction.mutations[0];
      const result = await trpc.tagDefinitions.delete.mutate({
        id: deletedTagDefinition.id,
      });

      return { txid: result.txid };
    },
  })
);

export const mediaTagsCollection = createCollection(
  electricCollectionOptions({
    id: 'media-tags',
    shapeOptions: {
      url: new URL(
        `/api/media-tags`,
        typeof window !== `undefined`
          ? window.location.origin
          : `http://localhost:5173`
      ).toString(),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    schema: mediaTagCollectionSchema,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified: newMediaTag } = transaction.mutations[0];
      const result = await trpc.mediaTags.create.mutate({
        ...newMediaTag,
      });

      return { txid: result.txid };
    },
    onUpdate: async () => {
      throw new Error('Media tags cannot be updated');
    },
    onDelete: async ({ transaction }) => {
      const { original: deletedMediaTag } = transaction.mutations[0];
      const result = await trpc.mediaTags.delete.mutate({
        id: deletedMediaTag.id,
      });

      return { txid: result.txid };
    },
  })
);
