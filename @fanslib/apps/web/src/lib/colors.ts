import type { PostStatus } from "@fanslib/server/schemas";

export type ColorDefinition = {
  name: string;
  background: string; // oklch value
  foreground: string; // oklch value
};

export type ColorPreset = ColorDefinition & {
  id: string;
};

export const baseColors = {
  softCoral: {
    background: 'oklch(85% 0.12 25)',
    foreground: 'oklch(35% 0.15 25)',
  },
  softMint: {
    background: 'oklch(85% 0.10 160)',
    foreground: 'oklch(35% 0.12 160)',
  },
  softLavender: {
    background: 'oklch(85% 0.08 280)',
    foreground: 'oklch(35% 0.10 280)',
  },
  postedTeal: {
    background: 'oklch(85% 0.10 165)',
    foreground: 'oklch(40% 0.12 165)',
  },
  scheduledSky: {
    background: 'oklch(85% 0.10 230)',
    foreground: 'oklch(40% 0.12 230)',
  },
  draftSlate: {
    background: 'oklch(85% 0.02 240)',
    foreground: 'oklch(40% 0.03 240)',
  },
  readyAmber: {
    background: 'oklch(92% 0.06 85)',
    foreground: 'oklch(40% 0.10 85)',
  },
  softPink: {
    background: 'oklch(82% 0.12 340)',
    foreground: 'oklch(40% 0.15 340)',
  },
  softPeach: {
    background: 'oklch(88% 0.10 60)',
    foreground: 'oklch(40% 0.12 60)',
  },
  softYellow: {
    background: 'oklch(95% 0.12 95)',
    foreground: 'oklch(45% 0.12 95)',
  },
  softLime: {
    background: 'oklch(92% 0.12 130)',
    foreground: 'oklch(40% 0.12 130)',
  },
  softAqua: {
    background: 'oklch(90% 0.10 180)',
    foreground: 'oklch(40% 0.10 180)',
  },
  softPeriwinkle: {
    background: 'oklch(84% 0.10 250)',
    foreground: 'oklch(35% 0.12 250)',
  },
  softLilac: {
    background: 'oklch(84% 0.12 300)',
    foreground: 'oklch(35% 0.15 300)',
  },
  softRose: {
    background: 'oklch(84% 0.10 15)',
    foreground: 'oklch(35% 0.15 15)',
  },
} as const;

export type BaseColorName = keyof typeof baseColors;

export const TAG_TYPE_COLORS: Record<string, ColorDefinition> = {
  categorical: {
    name: 'Categorical',
    background: baseColors.softCoral.background,
    foreground: baseColors.softCoral.foreground,
  },
  numerical: {
    name: 'Numerical',
    background: baseColors.softMint.background,
    foreground: baseColors.softMint.foreground,
  },
  boolean: {
    name: 'Boolean',
    background: baseColors.softLavender.background,
    foreground: baseColors.softLavender.foreground,
  },
} as const;

export const POST_STATUS_COLORS: Record<string, ColorDefinition> = {
  posted: {
    name: 'Posted',
    background: baseColors.postedTeal.background,
    foreground: baseColors.postedTeal.foreground,
  },
  scheduled: {
    name: 'Scheduled',
    background: baseColors.scheduledSky.background,
    foreground: baseColors.scheduledSky.foreground,
  },
  ready: {
    name: 'Ready',
    background: baseColors.readyAmber.background,
    foreground: baseColors.readyAmber.foreground,
  },
  draft: {
    name: 'Draft',
    background: baseColors.draftSlate.background,
    foreground: baseColors.draftSlate.foreground,
  },
} as const;

export const VERIFICATION_STATUS_COLORS: Record<string, ColorDefinition> = {
  UNKNOWN: {
    name: 'Unknown',
    background: baseColors.softPeriwinkle.background,
    foreground: baseColors.softPeriwinkle.foreground,
  },
  NOT_NEEDED: {
    name: 'Not Needed',
    background: baseColors.softAqua.background,
    foreground: baseColors.softAqua.foreground,
  },
  NEEDED: {
    name: 'Needed',
    background: baseColors.softYellow.background,
    foreground: baseColors.softYellow.foreground,
  },
  APPLIED: {
    name: 'Applied',
    background: baseColors.softPeach.background,
    foreground: baseColors.softPeach.foreground,
  },
  REJECTED: {
    name: 'Rejected',
    background: baseColors.softRose.background,
    foreground: baseColors.softRose.foreground,
  },
  VERIFIED: {
    name: 'Verified',
    background: baseColors.softLime.background,
    foreground: baseColors.softLime.foreground,
  },
} as const;

export const USER_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'pink',
    name: 'Soft Pink',
    background: baseColors.softPink.background,
    foreground: baseColors.softPink.foreground,
  },
  {
    id: 'peach',
    name: 'Soft Peach',
    background: baseColors.softPeach.background,
    foreground: baseColors.softPeach.foreground,
  },
  {
    id: 'yellow',
    name: 'Soft Yellow',
    background: baseColors.softYellow.background,
    foreground: baseColors.softYellow.foreground,
  },
  {
    id: 'lime',
    name: 'Soft Lime',
    background: baseColors.softLime.background,
    foreground: baseColors.softLime.foreground,
  },
  {
    id: 'aqua',
    name: 'Soft Aqua',
    background: baseColors.softAqua.background,
    foreground: baseColors.softAqua.foreground,
  },
  {
    id: 'periwinkle',
    name: 'Soft Periwinkle',
    background: baseColors.softPeriwinkle.background,
    foreground: baseColors.softPeriwinkle.foreground,
  },
  {
    id: 'lilac',
    name: 'Soft Lilac',
    background: baseColors.softLilac.background,
    foreground: baseColors.softLilac.foreground,
  },
  {
    id: 'rose',
    name: 'Soft Rose',
    background: baseColors.softRose.background,
    foreground: baseColors.softRose.foreground,
  },
];

export const DEFAULT_SCHEDULE_COLOR = USER_COLOR_PRESETS[0].background;

export const CHANNEL_COLORS: Record<string, ColorDefinition> = {
  reddit: {
    name: 'Reddit',
    background: 'oklch(65% 0.25 35)', // Reddit Orange
    foreground: 'oklch(100% 0 0)', // White
  },
  fansly: {
    name: 'Fansly',
    background: 'oklch(70% 0.20 20)', // Fansly Red/Pink
    foreground: 'oklch(100% 0 0)', // White
  },
  manyvids: {
    name: 'ManyVids',
    background: 'oklch(65% 0.20 340)', // ManyVids Pink
    foreground: 'oklch(100% 0 0)', // White
  },
  bluesky: {
    name: 'Bluesky',
    background: 'oklch(60% 0.20 250)', // Bluesky Blue
    foreground: 'oklch(100% 0 0)', // White
  },
  redgifs: {
    name: 'RedGIFs',
    background: 'oklch(60% 0.25 350)', // RedGIFs Magenta
    foreground: 'oklch(100% 0 0)', // White
  },
  clips4sale: {
    name: 'Clips4Sale',
    background: 'oklch(55% 0.20 290)', // Clips4Sale Purple
    foreground: 'oklch(100% 0 0)', // White
  },
} as const;

export const getTagTypeStyles = (dataType: "categorical" | "numerical" | "boolean") => {
  const colors = TAG_TYPE_COLORS[dataType];
  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderColor: colors.foreground,
  };
};

export const getPostStatusStyles = (status: PostStatus) => {
  const colors = POST_STATUS_COLORS[status];
  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderColor: colors.foreground,
  };
};

export const getPostStatusBorderColor = (status: PostStatus): string =>
  POST_STATUS_COLORS[status].background;

export const getRandomPresetId = (): string => {
  const randomIndex = Math.floor(Math.random() * USER_COLOR_PRESETS.length);
  return `preset:${USER_COLOR_PRESETS[randomIndex].id}`;
};

export const getStablePresetId = (tagId: number): string => {
  const index = tagId % USER_COLOR_PRESETS.length;
  return `preset:${USER_COLOR_PRESETS[index].id}`;
};

export const getColorDefinitionFromString = (colorString: string | null, tagId: number): ColorDefinition => {
  // If null or invalid, use stable fallback
  if (!colorString) {
    const index = tagId % USER_COLOR_PRESETS.length;
    return USER_COLOR_PRESETS[index];
  }

  // Parse preset format: "preset:pink"
  if (colorString.startsWith('preset:')) {
    const presetId = colorString.substring(7);
    const preset = USER_COLOR_PRESETS.find((p) => p.id === presetId);
    if (preset) return preset;
  }

  // Parse custom format: "custom:bg|fg"
  if (colorString.startsWith('custom:')) {
    const colors = colorString.substring(7).split('|');
    if (colors.length === 2) {
      return {
        name: 'Custom',
        background: colors[0],
        foreground: colors[1],
      };
    }
  }

  // Fallback to stable preset if format is unrecognized
  const index = tagId % USER_COLOR_PRESETS.length;
  return USER_COLOR_PRESETS[index];
};
