import { describe, expect, test } from "bun:test";
import type { WatermarkOperation, Operation, RelativeCoordinate } from "./types";

describe("Operation types", () => {
  test("watermark operation has required fields with relative coordinates", () => {
    const op: WatermarkOperation = {
      type: "watermark",
      id: "test-id-1",
      assetId: "asset-123",
      x: 0.85,
      y: 0.9,
      width: 0.1,
      opacity: 0.7,
    };

    expect(op.type).toBe("watermark");
    expect(op.x).toBeGreaterThanOrEqual(0);
    expect(op.x).toBeLessThanOrEqual(1);
    expect(op.y).toBeGreaterThanOrEqual(0);
    expect(op.y).toBeLessThanOrEqual(1);
    expect(op.width).toBeGreaterThanOrEqual(0);
    expect(op.width).toBeLessThanOrEqual(1);
    expect(op.opacity).toBeGreaterThanOrEqual(0);
    expect(op.opacity).toBeLessThanOrEqual(1);
  });

  test("Operation union includes watermark type", () => {
    const ops: Operation[] = [
      { type: "watermark", id: "test-id-2", assetId: "a1", x: 0.5, y: 0.5, width: 0.2, opacity: 1 },
    ];

    expect(ops).toHaveLength(1);
    expect(ops[0]?.type).toBe("watermark");
  });

  test("RelativeCoordinate is a number type alias usable for 0-1 values", () => {
    const coord: RelativeCoordinate = 0.5;
    expect(coord).toBe(0.5);
  });
});
