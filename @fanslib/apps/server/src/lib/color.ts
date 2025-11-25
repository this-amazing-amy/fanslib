export const validateHexColor = (color: string): string | null => {
  if (!color) {
    return null;
  }

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  if (!hexColorRegex.test(color)) {
    return "Color must be a valid hex format (e.g., #FF0000 or #F00)";
  }

  return null;
};

export const normalizeHexColor = (color: string): string => {
  if (!color) return color;

  if (color.length === 4 && color.startsWith("#")) {
    const shortHex = color.slice(1);
    return `#${shortHex
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }

  return color.toUpperCase();
};

export const validateColorFormat = (color: string): string | null => {
  if (!color) {
    return null;
  }

  // Accept preset format: preset:pink
  if (color.startsWith('preset:')) {
    const presetId = color.substring(7);
    const validPresets = ['pink', 'peach', 'yellow', 'lime', 'aqua', 'periwinkle', 'lilac', 'rose'];
    if (!validPresets.includes(presetId)) {
      return `Invalid preset ID. Must be one of: ${validPresets.join(', ')}`;
    }
    return null;
  }

  // Accept custom format: custom:oklch(...)|oklch(...)
  if (color.startsWith('custom:')) {
    return null;
  }

  // For backwards compatibility, still accept hex
  return validateHexColor(color);
};



