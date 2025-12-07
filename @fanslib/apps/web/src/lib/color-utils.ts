/**
 * Darkens a hex color by the specified amount.
 * @param hex - Hex color string (e.g., "#ff0000")
 * @param amount - Amount to darken (0-1, default 0.15)
 * @returns Darkened hex color string
 */
export const darkenColor = (hex: string, amount: number = 0.15): string => {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

/**
 * Lightens a hex color by the specified amount.
 * @param hex - Hex color string (e.g., "#ff0000")
 * @param amount - Amount to lighten (0-1, default 0.15)
 * @returns Lightened hex color string
 */
export const lightenColor = (hex: string, amount: number = 0.15): string => {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

type RGB = { r: number; g: number; b: number };

const hexToRgb = (hex: string): RGB | null => {
  const cleanHex = hex.replace("#", "");
  if (![3, 6].includes(cleanHex.length)) return null;
  const normalized = cleanHex.length === 3
    ? cleanHex.split("").map((char) => char + char).join("")
    : cleanHex;
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
};

const rgbToHex = ({ r, g, b }: RGB): string =>
  `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
    .join("")}`;

export const mixHexColors = (hexA: string, hexB: string, ratio: number = 0.5): string => {
  const colorA = hexToRgb(hexA);
  const colorB = hexToRgb(hexB);
  if (!colorA || !colorB) return hexA;
  const t = Math.max(0, Math.min(1, ratio));
  const mix = (a: number, b: number) => Math.round(a * (1 - t) + b * t);
  return rgbToHex({
    r: mix(colorA.r, colorB.r),
    g: mix(colorA.g, colorB.g),
    b: mix(colorA.b, colorB.b),
  });
};
