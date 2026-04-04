/// <reference types="@testing-library/jest-dom" />
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Sparkline } from "./Sparkline";

describe("Sparkline", () => {
  const sampleData = [
    { timestamp: 1000, views: 0, interactionTime: 0 },
    { timestamp: 2000, views: 50, interactionTime: 5000 },
    { timestamp: 3000, views: 80, interactionTime: 8000 },
    { timestamp: 4000, views: 95, interactionTime: 9500 },
    { timestamp: 5000, views: 100, interactionTime: 10000 },
  ];

  test("renders an SVG element", () => {
    const { container } = render(
      <Sparkline datapoints={sampleData} metric="views" width={120} height={32} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  test("renders nothing when datapoints array is empty", () => {
    const { container } = render(
      <Sparkline datapoints={[]} metric="views" width={120} height={32} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  test("renders nothing with fewer than 2 datapoints", () => {
    const { container } = render(
      <Sparkline datapoints={[sampleData[0]]} metric="views" width={120} height={32} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  test("renders a path element for the line", () => {
    const { container } = render(
      <Sparkline datapoints={sampleData} metric="views" width={120} height={32} />,
    );
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });
});
