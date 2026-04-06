import type { Track, Operation } from "@fanslib/video/types";
import type { ClipRange } from "~/stores/clipStore";

type KeyframedOp = Operation & {
  keyframes?: Array<{ frame: number; [key: string]: unknown }>;
};

export const intersectOperationsWithClip = (tracks: Track[], clip: ClipRange): Track[] => {
  const clipDuration = clip.endFrame - clip.startFrame;

  return tracks
    .map((track) => {
      const remapped = track.operations.flatMap((op) => {
        const typedOp = op as KeyframedOp & { startFrame?: number; endFrame?: number };
        const opStart = typedOp.startFrame ?? 0;
        const opEnd = typedOp.endFrame ?? 0;

        // Check overlap: operation must intersect with clip
        if (opEnd <= clip.startFrame || opStart >= clip.endFrame) return [];

        // Clamp to clip boundaries and remap
        const clampedStart = Math.max(opStart, clip.startFrame) - clip.startFrame;
        const clampedEnd = Math.min(opEnd, clip.endFrame) - clip.startFrame;

        const remappedOp = {
          ...typedOp,
          startFrame: clampedStart,
          endFrame: clampedEnd,
        };

        // Remap keyframes
        if (typedOp.keyframes) {
          remappedOp.keyframes = typedOp.keyframes
            .map((kf) => ({
              ...kf,
              frame: kf.frame - clip.startFrame,
            }))
            .filter((kf) => kf.frame >= 0 && kf.frame <= clipDuration);
        }

        return [remappedOp as Operation];
      });

      if (remapped.length === 0) return null;

      return {
        id: track.id,
        name: track.name,
        operations: remapped,
      };
    })
    .filter((t): t is Track => t !== null);
};
