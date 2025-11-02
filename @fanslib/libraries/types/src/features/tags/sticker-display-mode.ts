export const STICKER_DISPLAY_MODES = ["none", "color", "short"] as const;
export type StickerDisplayMode = (typeof STICKER_DISPLAY_MODES)[number];

