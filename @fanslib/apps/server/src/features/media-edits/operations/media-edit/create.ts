import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaEdit, MediaEditTypeSchema, TrackSchema } from "../../entity";
import { flattenTracks } from "../../flatten-tracks";

export const CreateMediaEditRequestBodySchema = z.object({
  sourceMediaId: z.string(),
  type: MediaEditTypeSchema,
  operations: z.array(z.unknown()).default([]),
  tracks: z.array(TrackSchema).nullable().optional(),
});

export const createMediaEdit = async (
  payload: z.infer<typeof CreateMediaEditRequestBodySchema>,
): Promise<MediaEdit> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  const tracks = payload.tracks ?? null;
  const operations = flattenTracks(tracks, payload.operations);

  const mediaEdit = repo.create({
    sourceMediaId: payload.sourceMediaId,
    type: payload.type,
    operations,
    tracks,
    status: "draft",
  });

  await repo.save(mediaEdit);

  const created = await repo.findOne({ where: { id: mediaEdit.id } });
  if (!created) {
    throw new Error(`Failed to fetch created MediaEdit with id ${mediaEdit.id}`);
  }
  return created;
};
