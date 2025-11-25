export type ColorDefinition = {
  name: string;
  background: string; // oklch value
  foreground: string; // oklch value
};

export type ColorPreset = ColorDefinition & {
  id: string;
};

export const TAG_TYPE_COLORS: Record<string, ColorDefinition> = {
  categorical: {
    name: 'Categorical',
    background: 'oklch(85% 0.12 25)', // Soft coral/pink
    foreground: 'oklch(35% 0.15 25)', // Darker coral for text/border
  },
  numerical: {
    name: 'Numerical',
    background: 'oklch(85% 0.10 160)', // Soft mint
    foreground: 'oklch(35% 0.12 160)', // Darker mint for text/border
  },
  boolean: {
    name: 'Boolean',
    background: 'oklch(85% 0.08 280)', // Soft lavender
    foreground: 'oklch(35% 0.10 280)', // Darker lavender for text/border
  },
} as const;

export const POST_STATUS_COLORS: Record<string, ColorDefinition> = {
  posted: {
    name: 'Posted',
    background: 'oklch(85% 0.10 165)', // Soft teal/turquoise green
    foreground: 'oklch(40% 0.12 165)', // Darker teal for text/border
  },
  scheduled: {
    name: 'Scheduled',
    background: 'oklch(85% 0.10 230)', // Soft sky blue
    foreground: 'oklch(40% 0.12 230)', // Darker sky blue for text/border
  },
  draft: {
    name: 'Draft',
    background: 'oklch(85% 0.02 240)', // Very soft gray-blue
    foreground: 'oklch(40% 0.03 240)', // Medium gray for text/border
  },
} as const;

export const USER_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'pink',
    name: 'Soft Pink',
    background: 'oklch(82% 0.12 340)',
    foreground: 'oklch(40% 0.15 340)', // Dark pink
  },
  {
    id: 'peach',
    name: 'Soft Peach',
    background: 'oklch(88% 0.10 60)',
    foreground: 'oklch(40% 0.12 60)', // Dark orange-brown
  },
  {
    id: 'yellow',
    name: 'Soft Yellow',
    background: 'oklch(95% 0.12 95)',
    foreground: 'oklch(45% 0.12 95)', // Dark yellow-brown
  },
  {
    id: 'lime',
    name: 'Soft Lime',
    background: 'oklch(92% 0.12 130)',
    foreground: 'oklch(40% 0.12 130)', // Dark green
  },
  {
    id: 'aqua',
    name: 'Soft Aqua',
    background: 'oklch(90% 0.10 180)',
    foreground: 'oklch(40% 0.10 180)', // Dark teal
  },
  {
    id: 'periwinkle',
    name: 'Soft Periwinkle',
    background: 'oklch(84% 0.10 250)',
    foreground: 'oklch(35% 0.12 250)', // Dark blue
  },
  {
    id: 'lilac',
    name: 'Soft Lilac',
    background: 'oklch(84% 0.12 300)',
    foreground: 'oklch(35% 0.15 300)', // Dark purple
  },
  {
    id: 'rose',
    name: 'Soft Rose',
    background: 'oklch(84% 0.10 15)',
    foreground: 'oklch(35% 0.15 15)', // Dark red
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

export function getTagTypeStyles(dataType: 'categorical' | 'numerical' | 'boolean') {
  const colors = TAG_TYPE_COLORS[dataType];
  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderColor: colors.foreground,
  };
}

export function getPostStatusStyles(status: 'posted' | 'scheduled' | 'draft') {
  const colors = POST_STATUS_COLORS[status];
  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderColor: colors.foreground,
  };
}

export function getPostStatusBorderColor(status: 'posted' | 'scheduled' | 'draft'): string {
  return POST_STATUS_COLORS[status].background;
}

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
