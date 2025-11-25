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
