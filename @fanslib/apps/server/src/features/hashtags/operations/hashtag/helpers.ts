export const normalizeHashtagName = (name: string): string => (name.startsWith("#") ? name : `#${name}`);

