import type { CaptionOperation } from "@fanslib/video/types";
import { measureText } from "@remotion/layout-utils";
import { describe, expect, test, vi } from "vitest";

vi.mock("@remotion/layout-utils", () => ({
  measureText: vi.fn(() => ({ width: 100, height: 20 })),
}));

import {
  captionAnimationViewportOffsetPx,
  captionHalfNormFromBox,
  measureCaptionBoxPx,
} from "./caption-layout";

describe("caption-layout", () => {
  const base: CaptionOperation = {
    type: "caption",
    text: "Hi",
    x: 0.5,
    y: 0.5,
    fontSize: 0.05,
    color: "#ffffff",
    animation: "fade-in",
    startFrame: 0,
    endFrame: 90,
  };

  test("captionHalfNormFromBox converts pixel half-extents to normalized", () => {
    const h = captionHalfNormFromBox(200, 40, 800, 450);
    expect(h.halfWNorm).toBeCloseTo(0.125, 5);
    expect(h.halfHNorm).toBeCloseTo(40 / 2 / 450, 5);
  });

  test("measureCaptionBoxPx adds stroke padding", () => {
    const r = measureCaptionBoxPx({ ...base, strokeWidth: 2 }, 1920);
    expect(r.widthPx).toBe(100 + 4);
    expect(r.heightPx).toBe(20 + 4);
  });

  test("measureCaptionBoxPx sums multiple lines", () => {
    vi.mocked(measureText).mockReturnValue({ width: 50, height: 18 });
    const r = measureCaptionBoxPx({ ...base, text: "a\nb\nc" }, 1920);
    expect(r.heightPx).toBe(18 * 3 + 0);
    expect(r.widthPx).toBe(50);
  });

  test("measureCaptionBoxPx uses viewport-scaled font size (matches on-screen text)", () => {
    vi.mocked(measureText).mockReturnValue({ width: 40, height: 14 });
    measureCaptionBoxPx(base, 800);
    expect(measureText).toHaveBeenCalledWith(
      expect.objectContaining({
        fontSize: 0.05 * 800,
        text: "Hi",
      }),
    );
  });

  test("captionAnimationViewportOffsetPx matches slide-up at composition scale", () => {
    const cap: CaptionOperation = {
      ...base,
      animation: "slide-up",
      startFrame: 0,
      endFrame: 90,
    };
    const h = 540;
    const o = captionAnimationViewportOffsetPx(cap, 0, h, 90);
    expect(o.dx).toBe(0);
    expect(o.dy).toBeCloseTo(50 * (h / 1080), 5);
  });

  test("captionAnimationViewportOffsetPx is zero for single-frame preview", () => {
    const cap: CaptionOperation = { ...base, animation: "slide-up" };
    const o = captionAnimationViewportOffsetPx(cap, 0, 400, 1);
    expect(o).toEqual({ dx: 0, dy: 0 });
  });
});
