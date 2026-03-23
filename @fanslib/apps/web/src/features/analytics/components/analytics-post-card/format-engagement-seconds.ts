export const formatEngagementSeconds = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  const remainingRounded = Number(remaining.toFixed(1));
  if (remainingRounded === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remaining.toFixed(1)}s`;
};
