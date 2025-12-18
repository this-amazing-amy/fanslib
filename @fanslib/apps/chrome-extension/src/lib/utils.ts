// Format date for display
export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Build local file path from relative media path
export const buildLocalPath = (libraryPath: string, relativePath: string) => {
  // Normalize paths - replace backslashes with forward slashes
  const normalizedLibrary = libraryPath.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedRelative = relativePath
    .replace(/\\/g, '/')
    .replace(/^\//, '');
  return `${normalizedLibrary}/${normalizedRelative}`;
};

// Check if media is a video
export const isVideo = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext ?? '');
};

// Escape HTML to prevent XSS
export const escapeHtml = (text: string) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Get media thumbnail URL from API
export const getMediaThumbnailUrl = (apiUrl: string, mediaId: string) => {
  const baseUrl = apiUrl.replace(/\/$/, '');
  return `${baseUrl}/api/media/${mediaId}/thumbnail`;
};

type ColorDefinition = {
  background: string;
  foreground: string;
};

const baseColors = {
  softPink: {
    background: 'oklch(82% 0.12 340)',
    foreground: 'oklch(40% 0.15 340)',
  },
  postedTeal: {
    background: 'oklch(85% 0.10 165)',
    foreground: 'oklch(40% 0.12 165)',
  },
};

const DEFAULT_SCHEDULE_COLOR = baseColors.softPink.background;

const getColorDefinitionFromString = (
  colorString: string | null
): ColorDefinition => {
  if (!colorString) {
    return baseColors.softPink;
  }

  if (colorString.startsWith('preset:')) {
    const presetId = colorString.substring(7);
    const presetMap: Record<string, ColorDefinition> = {
      pink: baseColors.softPink,
      peach: {
        background: 'oklch(88% 0.10 60)',
        foreground: 'oklch(40% 0.12 60)',
      },
      yellow: {
        background: 'oklch(95% 0.12 95)',
        foreground: 'oklch(45% 0.12 95)',
      },
      lime: {
        background: 'oklch(92% 0.12 130)',
        foreground: 'oklch(40% 0.12 130)',
      },
      aqua: {
        background: 'oklch(90% 0.10 180)',
        foreground: 'oklch(40% 0.10 180)',
      },
      periwinkle: {
        background: 'oklch(84% 0.10 250)',
        foreground: 'oklch(35% 0.12 250)',
      },
      lilac: {
        background: 'oklch(84% 0.12 300)',
        foreground: 'oklch(35% 0.15 300)',
      },
      rose: {
        background: 'oklch(84% 0.10 15)',
        foreground: 'oklch(35% 0.15 15)',
      },
    };
    return presetMap[presetId] || baseColors.softPink;
  }

  if (colorString.startsWith('custom:')) {
    const colors = colorString.substring(7).split('|');
    if (colors.length === 2) {
      return {
        background: colors[0],
        foreground: colors[1],
      };
    }
  }

  return baseColors.softPink;
};

export const getScheduleBadgeColors = (color: string | null | undefined) => {
  const colorDef = getColorDefinitionFromString(
    color ?? DEFAULT_SCHEDULE_COLOR
  );
  return {
    backgroundColor: colorDef.background,
    borderColor: colorDef.foreground,
    color: colorDef.foreground,
  };
};

export const getPostStatusStyles = (
  status: 'posted' | 'scheduled' | 'ready' | 'draft'
) => {
  const statusColors: Record<string, ColorDefinition> = {
    posted: baseColors.postedTeal,
    scheduled: {
      background: 'oklch(85% 0.10 230)',
      foreground: 'oklch(40% 0.12 230)',
    },
    ready: {
      background: 'oklch(92% 0.06 85)',
      foreground: 'oklch(40% 0.10 85)',
    },
    draft: {
      background: 'oklch(85% 0.02 240)',
      foreground: 'oklch(40% 0.03 240)',
    },
  };
  const colors = statusColors[status] || baseColors.postedTeal;
  return {
    backgroundColor: colors.background,
    color: colors.foreground,
    borderColor: colors.foreground,
  };
};

export const getPostStatusBorderColor = (
  status: 'posted' | 'scheduled' | 'ready' | 'draft'
): string => {
  const statusColors: Record<string, ColorDefinition> = {
    posted: baseColors.postedTeal,
    scheduled: {
      background: 'oklch(85% 0.10 230)',
      foreground: 'oklch(40% 0.12 230)',
    },
    ready: {
      background: 'oklch(92% 0.06 85)',
      foreground: 'oklch(40% 0.10 85)',
    },
    draft: {
      background: 'oklch(85% 0.02 240)',
      foreground: 'oklch(40% 0.03 240)',
    },
  };
  const colors = statusColors[status] || baseColors.postedTeal;
  return colors.background;
};
