/** Composition used for crop math (matches Remotion player). */
export const CROP_COMPOSITION_WIDTH = 1920;
export const CROP_COMPOSITION_HEIGHT = 1080;

export const CROP_COMPOSITION_ASPECT = CROP_COMPOSITION_WIDTH / CROP_COMPOSITION_HEIGHT;

export type CropAspectPreset = "16:9" | "9:16" | "1:1" | "4:5" | "free";

const PRESET_PIXEL_RATIO: Record<Exclude<CropAspectPreset, "free">, number> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
};

/** Target w/h for normalized crop rect (composition-relative fractions). */
export const normalizedCropAspectRatio = (
  preset: Exclude<CropAspectPreset, "free">,
): number => PRESET_PIXEL_RATIO[preset] / CROP_COMPOSITION_ASPECT;

const ASPECT_RATIOS: Record<string, number> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
};

export type CropOperation = {
  type: "crop";
  x: number;
  y: number;
  width: number;
  height: number;
  applied: boolean;
  aspectPreset?: CropAspectPreset;
};

type LegacyCrop = {
  type: "crop";
  aspectRatio: string;
  centerX: number;
  centerY: number;
};

export const isCropOperation = (op: unknown): op is CropOperation =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "crop" &&
  typeof (op as CropOperation).width === "number" &&
  typeof (op as CropOperation).height === "number";

const isLegacyCrop = (op: unknown): op is LegacyCrop =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "crop" &&
  "centerX" in op &&
  !("width" in op && typeof (op as { width?: unknown }).width === "number");

/** Legacy center + preset → rect (same math as old CropFrame). */
export const legacyCropToRect = (
  aspectRatio: string,
  centerX: number,
  centerY: number,
): { x: number; y: number; width: number; height: number } => {
  const sourceAspect = CROP_COMPOSITION_ASPECT;
  const targetAspect = ASPECT_RATIOS[aspectRatio] ?? 16 / 9;
  const cw = targetAspect > sourceAspect ? 1 : targetAspect / sourceAspect;
  const ch = targetAspect > sourceAspect ? sourceAspect / targetAspect : 1;
  const offsetX = (centerX - 0.5) * (1 - cw);
  const offsetY = (centerY - 0.5) * (1 - ch);
  const x = (1 - cw) / 2 + offsetX;
  const y = (1 - ch) / 2 + offsetY;
  return { x, y, width: cw, height: ch };
};

export const normalizeCropOperation = (op: unknown): unknown => {
  if (isLegacyCrop(op)) {
    const { x, y, width, height } = legacyCropToRect(
      op.aspectRatio,
      op.centerX,
      op.centerY,
    );
    return {
      type: "crop" as const,
      x,
      y,
      width,
      height,
      applied: true,
      aspectPreset: "free" as const,
    };
  }
  if (isCropOperation(op)) {
    return {
      ...op,
      applied: op.applied ?? true,
      aspectPreset: op.aspectPreset ?? "free",
    };
  }
  return op;
};

export const MIN_CROP = 0.02;

/** Minimum crop width/height in composition pixels (see {@link clampCropRect}). */
export const MIN_CROP_WIDTH_PX = MIN_CROP * CROP_COMPOSITION_WIDTH;
export const MIN_CROP_HEIGHT_PX = MIN_CROP * CROP_COMPOSITION_HEIGHT;

export const cropRectPixelsFromOperation = (c: CropOperation) => ({
  xPx: c.x * CROP_COMPOSITION_WIDTH,
  yPx: c.y * CROP_COMPOSITION_HEIGHT,
  wPx: c.width * CROP_COMPOSITION_WIDTH,
  hPx: c.height * CROP_COMPOSITION_HEIGHT,
});

const clampPixelRect = (r: {
  xPx: number;
  yPx: number;
  wPx: number;
  hPx: number;
}) => {
  const wPx = Math.max(MIN_CROP_WIDTH_PX, Math.min(CROP_COMPOSITION_WIDTH, r.wPx));
  const hPx = Math.max(MIN_CROP_HEIGHT_PX, Math.min(CROP_COMPOSITION_HEIGHT, r.hPx));
  const xPx = Math.max(0, Math.min(CROP_COMPOSITION_WIDTH - wPx, r.xPx));
  const yPx = Math.max(0, Math.min(CROP_COMPOSITION_HEIGHT - hPx, r.yPx));
  return { xPx, yPx, wPx, hPx };
};

/** Update a crop using composition-space pixel coordinates (1920×1080). */
export const cropOperationWithPixelRect = (
  base: CropOperation,
  pixel: Partial<Record<"xPx" | "yPx" | "wPx" | "hPx", number>>,
): CropOperation => {
  const cur = cropRectPixelsFromOperation(base);
  const merged = {
    xPx: pixel.xPx ?? cur.xPx,
    yPx: pixel.yPx ?? cur.yPx,
    wPx: pixel.wPx ?? cur.wPx,
    hPx: pixel.hPx ?? cur.hPx,
  };
  const c = clampPixelRect(merged);
  return clampCropRect({
    ...base,
    x: c.xPx / CROP_COMPOSITION_WIDTH,
    y: c.yPx / CROP_COMPOSITION_HEIGHT,
    width: c.wPx / CROP_COMPOSITION_WIDTH,
    height: c.hPx / CROP_COMPOSITION_HEIGHT,
  });
};

export const pixelHeightFromWidthForPreset = (
  preset: Exclude<CropAspectPreset, "free">,
  wPx: number,
): number => wPx / PRESET_PIXEL_RATIO[preset];

export const pixelWidthFromHeightForPreset = (
  preset: Exclude<CropAspectPreset, "free">,
  hPx: number,
): number => hPx * PRESET_PIXEL_RATIO[preset];

export const clampCropRect = (c: CropOperation): CropOperation => {
  const w = Math.max(MIN_CROP, Math.min(1, c.width));
  const h = Math.max(MIN_CROP, Math.min(1, c.height));
  const x = Math.max(0, Math.min(1 - w, c.x));
  const y = Math.max(0, Math.min(1 - h, c.y));
  return { ...c, x, y, width: w, height: h };
};
