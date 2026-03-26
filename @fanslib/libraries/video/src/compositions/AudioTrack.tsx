import React from "react";
import { Audio } from "remotion";
import type { AudioOperation } from "../types";

type AudioTrackProps = {
  audio: AudioOperation;
  audioUrl: string;
  fps: number;
};

/**
 * Renders an audio overlay using Remotion's <Audio> component.
 * Handles offset (negative = trim start of audio) and crossfade volume.
 */
export const AudioTrack: React.FC<AudioTrackProps> = ({
  audio,
  audioUrl,
  fps,
}) => {
  // If offset is negative, start from that many frames into the audio
  const startFrom = audio.offsetFrames < 0 ? Math.abs(audio.offsetFrames) : 0;
  // If offset is positive, delay the audio by that many frames
  const from = audio.offsetFrames > 0 ? audio.offsetFrames : 0;

  return (
    <Audio
      src={audioUrl}
      startFrom={startFrom}
      volume={audio.crossfade}
      {...(from > 0 ? { startFrom: from } : {})}
    />
  );
};
