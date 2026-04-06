import { interpolate, Easing } from "remotion";

export type EasingType = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export type Keyframe = {
  frame: number;
  values: Record<string, number>;
  easing?: EasingType;
};

const getEasingFn = (type: EasingType = "linear") => {
  switch (type) {
    case "ease-in":
      return Easing.in(Easing.ease);
    case "ease-out":
      return Easing.out(Easing.ease);
    case "ease-in-out":
      return Easing.inOut(Easing.ease);
    default:
      return (t: number) => t; // linear
  }
};

/**
 * Interpolates between keyframes at the given frame for the specified properties.
 * Returns a record of property name → interpolated value.
 *
 * Behavior:
 * - Before first keyframe: holds first keyframe values
 * - After last keyframe: holds last keyframe values
 * - Between keyframes: interpolates using the starting keyframe's easing
 * - Empty keyframes: returns 0 for all properties
 * - Single keyframe: returns that keyframe's values everywhere
 */
export const interpolateKeyframes = (
  keyframes: Keyframe[],
  frame: number,
  properties: string[],
): Record<string, number> => {
  if (keyframes.length === 0) {
    return Object.fromEntries(properties.map((p) => [p, 0]));
  }

  // Sort by frame
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first || !last) {
    return Object.fromEntries(properties.map((p) => [p, 0]));
  }

  if (sorted.length === 1) {
    return Object.fromEntries(properties.map((p) => [p, first.values[p] ?? 0]));
  }

  // Before first keyframe
  if (frame <= first.frame) {
    return Object.fromEntries(properties.map((p) => [p, first.values[p] ?? 0]));
  }

  // After last keyframe
  if (frame >= last.frame) {
    return Object.fromEntries(properties.map((p) => [p, last.values[p] ?? 0]));
  }

  // Find surrounding keyframes
  const nextIdx = sorted.findIndex((k) => k.frame >= frame);
  const prevIdx = nextIdx - 1;
  const prev = sorted[prevIdx];
  const next = sorted[nextIdx];

  if (!prev || !next) {
    return Object.fromEntries(properties.map((p) => [p, 0]));
  }

  // Exact match
  if (next.frame === frame) {
    return Object.fromEntries(properties.map((p) => [p, next.values[p] ?? 0]));
  }

  // Interpolate between prev and next
  const easingFn = getEasingFn(prev.easing);

  return Object.fromEntries(
    properties.map((p) => {
      const from = prev.values[p] ?? 0;
      const to = next.values[p] ?? 0;
      const value = interpolate(frame, [prev.frame, next.frame], [from, to], {
        easing: easingFn,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return [p, value];
    }),
  );
};
