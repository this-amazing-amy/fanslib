export const formatBytes = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];

  const findUnit = (size: number, index: number): [number, number] =>
    size >= 1024 && index < units.length - 1
      ? findUnit(size / 1024, index + 1)
      : [size, index];

  const [size, unitIndex] = findUnit(bytes, 0);
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
};

