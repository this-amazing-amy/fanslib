export type Segment = {
  id: string;
  sourceMediaId: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  transition?: {
    type: "crossfade";
    durationFrames: number;
  };
};

export type SequencePosition = {
  segmentId: string;
  sequenceStartFrame: number;
  sequenceEndFrame: number;
};

export type SequenceTimeline = {
  positions: SequencePosition[];
  totalDuration: number;
};

export type SourceFrameMapping = {
  segmentId: string;
  sourceMediaId: string;
  sourceFrame: number;
};

export const mapSequenceFrameToSource = (
  sequenceFrame: number,
  timeline: SequenceTimeline,
  segments: Segment[],
): SourceFrameMapping[] =>
  timeline.positions.reduce<SourceFrameMapping[]>((results, position, i) => {
    const segment = segments[i]!;
    if (sequenceFrame >= position.sequenceStartFrame && sequenceFrame < position.sequenceEndFrame) {
      const offsetInSegment = sequenceFrame - position.sequenceStartFrame;
      return [
        ...results,
        {
          segmentId: segment.id,
          sourceMediaId: segment.sourceMediaId,
          sourceFrame: segment.sourceStartFrame + offsetInSegment,
        },
      ];
    }
    return results;
  }, []);

export const computeSequenceTimeline = (segments: Segment[]): SequenceTimeline => {
  if (segments.length === 0) {
    return { positions: [], totalDuration: 0 };
  }

  const positions = segments.reduce<{ positions: SequencePosition[]; cursor: number }>(
    (acc, segment, i) => {
      const segmentDuration = segment.sourceEndFrame - segment.sourceStartFrame;
      const overlap = i > 0 && segment.transition ? segment.transition.durationFrames : 0;
      const start = acc.cursor - overlap;

      return {
        positions: [
          ...acc.positions,
          {
            segmentId: segment.id,
            sequenceStartFrame: start,
            sequenceEndFrame: start + segmentDuration,
          },
        ],
        cursor: start + segmentDuration,
      };
    },
    { positions: [], cursor: 0 },
  );

  return {
    positions: positions.positions,
    totalDuration: positions.cursor,
  };
};
