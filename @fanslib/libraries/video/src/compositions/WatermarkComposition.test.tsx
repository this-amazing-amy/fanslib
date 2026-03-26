import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { WatermarkComposition } from "./WatermarkComposition";

describe("WatermarkComposition", () => {
  test("renders an img for the source media", () => {
    const html = renderToString(
      <WatermarkComposition
        sourceUrl="https://example.com/source.jpg"
        watermark={{
          type: "watermark",
          assetId: "asset-1",
          x: 0.85,
          y: 0.9,
          width: 0.1,
          opacity: 0.7,
        }}
        watermarkUrl="https://example.com/watermark.png"
      />,
    );

    expect(html).toContain("source.jpg");
    expect(html).toContain("watermark.png");
  });

  test("positions watermark using relative coordinates as percentages", () => {
    const html = renderToString(
      <WatermarkComposition
        sourceUrl="https://example.com/source.jpg"
        watermark={{
          type: "watermark",
          assetId: "asset-1",
          x: 0.5,
          y: 0.25,
          width: 0.2,
          opacity: 0.8,
        }}
        watermarkUrl="https://example.com/watermark.png"
      />,
    );

    // Position should be expressed as percentages (50%, 25%)
    expect(html).toContain("50%");
    expect(html).toContain("25%");
    // Width should be 20%
    expect(html).toContain("20%");
    // Opacity should be 0.8
    expect(html).toContain("0.8");
  });
});
