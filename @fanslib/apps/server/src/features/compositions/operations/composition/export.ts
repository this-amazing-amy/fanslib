import { db } from "../../../../lib/db";
import { Composition } from "../../entity";
import { MediaEdit } from "../../../media-edits/entity";

type ExportRegionData = {
  id: string;
  startFrame: number;
  endFrame: number;
  package?: string | null;
  role?: string | null;
  contentRating?: string | null;
  quality?: string | null;
};

type SegmentData = {
  id: string;
  sourceMediaId: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
};

export const exportComposition = async (
  compositionId: string,
): Promise<MediaEdit[]> => {
  const database = await db();
  const compRepo = database.getRepository(Composition);
  const editRepo = database.getRepository(MediaEdit);

  const composition = await compRepo.findOne({ where: { id: compositionId } });
  if (!composition) {
    throw new Error("Composition not found");
  }

  const segments = composition.segments as SegmentData[];
  const tracks = composition.tracks as unknown[];
  const exportRegions = composition.exportRegions as ExportRegionData[];

  // Use the first segment's sourceMediaId as the primary source media reference.
  // For compositions with no segments, this will fail — but that's an invalid state.
  const primarySourceMediaId = segments[0]?.sourceMediaId;
  if (!primarySourceMediaId) {
    throw new Error("Composition has no segments");
  }

  if (exportRegions.length === 0) {
    // No export regions: treat whole timeline as one region
    const edit = editRepo.create({
      sourceMediaId: primarySourceMediaId,
      compositionId: composition.id,
      type: "composition" as const,
      operations: [],
      tracks,
      segments,
      exportRegion: null,
      status: "queued",
    });
    const saved = await editRepo.save(edit);
    return [saved];
  }

  // Create one MediaEdit per export region
  const edits: MediaEdit[] = [];
  for (const region of exportRegions) {
    const edit = editRepo.create({
      sourceMediaId: primarySourceMediaId,
      compositionId: composition.id,
      type: "composition" as const,
      operations: [],
      tracks,
      segments,
      exportRegion: { startFrame: region.startFrame, endFrame: region.endFrame },
      package: region.package ?? null,
      role: region.role ?? null,
      contentRating: region.contentRating ?? null,
      quality: region.quality ?? null,
      status: "queued",
    });
    const saved = await editRepo.save(edit);
    edits.push(saved);
  }

  return edits;
};
