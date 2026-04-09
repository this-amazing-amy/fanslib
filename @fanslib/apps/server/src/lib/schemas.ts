import { z } from "zod";

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  operations: z.array(z.unknown()),
});

export const SegmentTransitionSchema = z.object({
  type: z.literal("crossfade"),
  durationFrames: z.number(),
  easing: z.string().optional(),
});

export const SegmentSchema = z.object({
  id: z.string(),
  sourceMediaId: z.string(),
  sourceStartFrame: z.number(),
  sourceEndFrame: z.number(),
  transition: SegmentTransitionSchema.optional(),
});
