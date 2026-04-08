import { z } from "zod";
import { db } from "../../../../lib/db";
import { Composition, SegmentSchema, TrackSchema, ExportRegionSchema } from "../../entity";

export const UpdateCompositionRequestBodySchema = z.object({
  name: z.string().optional(),
  segments: z.array(SegmentSchema).optional(),
  tracks: z.array(TrackSchema).optional(),
  exportRegions: z.array(ExportRegionSchema).optional(),
});

export const updateComposition = async (
  id: string,
  payload: z.infer<typeof UpdateCompositionRequestBodySchema>,
): Promise<Composition | null> => {
  const database = await db();
  const repo = database.getRepository(Composition);

  const composition = await repo.findOne({ where: { id } });
  if (!composition) return null;

  if (payload.name !== undefined) composition.name = payload.name;
  if (payload.segments !== undefined) composition.segments = payload.segments;
  if (payload.tracks !== undefined) composition.tracks = payload.tracks;
  if (payload.exportRegions !== undefined) composition.exportRegions = payload.exportRegions;

  await repo.save(composition);
  return composition;
};
