import { describe, expect, test } from "vitest";
import { metricValueFromAggregatedDay, metricValueFromRawIncrements } from "./chart-metric";

describe("metricValueFromAggregatedDay", () => {
  test("views returns cumulative total for the day", () => {
    expect(
      metricValueFromAggregatedDay({ views: 100, interactionTime: 50_000 }, null, "views"),
    ).toBe(100);
  });

  test("engagement seconds uses delta from previous day for average seconds per view", () => {
    const previous = { views: 40, interactionTime: 20_000 };
    const point = { views: 100, interactionTime: 50_000 };
    const dV = 60;
    const dT = 30_000;
    const expected = dT / 1000 / dV;
    expect(metricValueFromAggregatedDay(point, previous, "engagementSeconds")).toBeCloseTo(expected);
  });

  test("first day uses interaction and views from zero baseline", () => {
    expect(metricValueFromAggregatedDay({ views: 10, interactionTime: 5000 }, null, "engagementSeconds")).toBeCloseTo(
      5000 / 1000 / 10,
    );
  });
});

describe("metricValueFromRawIncrements", () => {
  test("views is cumulative over sorted increments", () => {
    const sorted = [
      { timestamp: 1, views: 10, interactionTime: 1000 },
      { timestamp: 2, views: 5, interactionTime: 500 },
    ];
    expect(metricValueFromRawIncrements(sorted, 0, "views")).toBe(10);
    expect(metricValueFromRawIncrements(sorted, 1, "views")).toBe(15);
  });

  test("engagement uses per-row average for that increment", () => {
    const sorted = [{ timestamp: 1, views: 10, interactionTime: 25_000 }];
    expect(metricValueFromRawIncrements(sorted, 0, "engagementSeconds")).toBeCloseTo(25_000 / 1000 / 10);
  });
});
