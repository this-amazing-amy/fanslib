import { describe, expect, test } from "vitest";
import { aggregateDatapoints } from "./aggregate";

describe("aggregateDatapoints", () => {
  test("returns empty array for empty input", () => {
    expect(aggregateDatapoints([], "2023-11-14")).toEqual([]);
  });

  test("preserves cumulative interactionTime in aggregated data", () => {
    const datapoints = [
      { timestamp: 1699920000000, views: 10, interactionTime: 5000 },
      { timestamp: 1700006400000, views: 25, interactionTime: 15000 },
    ];

    const result = aggregateDatapoints(datapoints, "2023-11-14");

    const lastPoint = result[result.length - 1];
    expect(lastPoint?.interactionTime).toBe(20000);
  });

  test("all aggregated points include interactionTime field", () => {
    const datapoints = [
      { timestamp: 1699920000000, views: 10, interactionTime: 5000 },
      { timestamp: 1700006400000, views: 25, interactionTime: 15000 },
    ];

    const result = aggregateDatapoints(datapoints, "2023-11-14");

    result.forEach((point) => {
      expect(point).toHaveProperty("interactionTime");
      expect(typeof point.interactionTime).toBe("number");
    });
  });
});
