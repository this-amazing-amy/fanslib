import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const OUTPUT_DIR = join(import.meta.dir, "..", "test-output");
const OUTPUT_FILE = join(OUTPUT_DIR, "watermark-smoke-test.png");

describe("renderStill smoke test", () => {
  afterAll(() => {
    // Clean up output
    if (existsSync(OUTPUT_FILE)) unlinkSync(OUTPUT_FILE);
  });

  test("renders a still frame with the watermark composition", async () => {
    if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: join(import.meta.dir, "entry.ts"),
    });

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "WatermarkComposition",
      inputProps: {
        sourceUrl: "https://picsum.photos/1920/1080",
        watermark: {
          type: "watermark",
          assetId: "test-asset",
          x: 0.85,
          y: 0.9,
          width: 0.1,
          opacity: 0.7,
        },
        watermarkUrl: "https://picsum.photos/200/200",
      },
    });

    // Render a still frame
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: OUTPUT_FILE,
      inputProps: {
        sourceUrl: "https://picsum.photos/1920/1080",
        watermark: {
          type: "watermark",
          assetId: "test-asset",
          x: 0.85,
          y: 0.9,
          width: 0.1,
          opacity: 0.7,
        },
        watermarkUrl: "https://picsum.photos/200/200",
      },
    });

    // Verify the output file exists and is non-empty
    expect(existsSync(OUTPUT_FILE)).toBe(true);
    const file = Bun.file(OUTPUT_FILE);
    const size = file.size;
    expect(size).toBeGreaterThan(0);
  }, 60000); // 60s timeout for bundling + rendering
});
