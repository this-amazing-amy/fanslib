import { describe, expect, test } from "bun:test";
import { interpolateKeyframes, type Keyframe, type EasingType } from "./keyframes";

describe("interpolateKeyframes", () => {
  test("returns exact values at a keyframe frame", () => {
    const keyframes: Keyframe[] = [
      { frame: 0, values: { x: 0, y: 0 } },
      { frame: 30, values: { x: 100, y: 200 } },
    ];

    const result = interpolateKeyframes(keyframes, 0, ["x", "y"]);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);

    const result2 = interpolateKeyframes(keyframes, 30, ["x", "y"]);
    expect(result2.x).toBe(100);
    expect(result2.y).toBe(200);
  });

  test("linearly interpolates between keyframes by default", () => {
    const keyframes: Keyframe[] = [
      { frame: 0, values: { x: 0 } },
      { frame: 100, values: { x: 100 } },
    ];

    const result = interpolateKeyframes(keyframes, 50, ["x"]);
    expect(result.x).toBe(50);
  });

  test("holds first keyframe value before first frame", () => {
    const keyframes: Keyframe[] = [
      { frame: 10, values: { x: 50 } },
      { frame: 20, values: { x: 100 } },
    ];

    const result = interpolateKeyframes(keyframes, 0, ["x"]);
    expect(result.x).toBe(50);
  });

  test("holds last keyframe value after last frame", () => {
    const keyframes: Keyframe[] = [
      { frame: 0, values: { x: 0 } },
      { frame: 10, values: { x: 100 } },
    ];

    const result = interpolateKeyframes(keyframes, 50, ["x"]);
    expect(result.x).toBe(100);
  });

  test("returns defaults when no keyframes exist", () => {
    const result = interpolateKeyframes([], 0, ["x", "y"]);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  test("single keyframe returns that value at any frame", () => {
    const keyframes: Keyframe[] = [{ frame: 10, values: { x: 42 } }];

    expect(interpolateKeyframes(keyframes, 0, ["x"]).x).toBe(42);
    expect(interpolateKeyframes(keyframes, 10, ["x"]).x).toBe(42);
    expect(interpolateKeyframes(keyframes, 100, ["x"]).x).toBe(42);
  });

  test("supports easing types", () => {
    const keyframes: Keyframe[] = [
      { frame: 0, values: { x: 0 }, easing: "ease-in" },
      { frame: 100, values: { x: 100 } },
    ];

    const mid = interpolateKeyframes(keyframes, 50, ["x"]);
    // With ease-in, the midpoint value should be less than 50 (slower start)
    expect(mid.x).toBeLessThan(50);
    expect(mid.x).toBeGreaterThan(0);
  });

  test("interpolates multiple properties independently", () => {
    const keyframes: Keyframe[] = [
      { frame: 0, values: { x: 0, y: 100, opacity: 1 } },
      { frame: 100, values: { x: 100, y: 0, opacity: 0 } },
    ];

    const result = interpolateKeyframes(keyframes, 50, ["x", "y", "opacity"]);
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.opacity).toBeCloseTo(0.5, 1);
  });
});
