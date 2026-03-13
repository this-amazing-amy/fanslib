/* eslint-disable functional/no-loop-statements */
/* eslint-disable functional/no-let */

export type PlateauConfig = {
  consecutiveDays: number;     // default 5
  thresholdPercent: number;    // default 1.5
  minDatapoints: number;       // default 7
};

export const DEFAULT_PLATEAU_CONFIG: PlateauConfig = {
  consecutiveDays: 5,
  thresholdPercent: 1.5,
  minDatapoints: 7,
};

/**
 * Detect whether a view series has plateaued (growth has effectively stopped).
 * Uses moving-average + adaptive-threshold approach.
 */
export const detectViewPlateau = (
  datapoints: { timestamp: number; views: number }[],
  config: PlateauConfig = DEFAULT_PLATEAU_CONFIG,
): boolean => {
  if (datapoints.length < config.minDatapoints) {
    return false;
  }

  // Sort by timestamp
  const sorted = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);

  // Compute relative change percentages between consecutive points
  const changes: number[] = [];
  sorted.forEach((point, i) => {
    if (i > 0) {
      const prev = sorted[i - 1]?.views ?? 0;
      const absoluteChange = point.views - prev;
      const relativeChangePercent = prev === 0 ? 100 : (absoluteChange / prev) * 100;
      changes.push(relativeChangePercent);
    }
  });

  if (changes.length === 0) {
    return false;
  }

  // Moving average of changes
  const movingAverageWindow = 3;
  const movingAverages: number[] = [];

  changes.forEach((_, i) => {
    const windowStart = Math.max(0, i - movingAverageWindow + 1);
    const windowSize = i - windowStart + 1;
    const sum = changes.slice(windowStart, i + 1).reduce((s, val) => s + val, 0);
    movingAverages.push(sum / windowSize);
  });

  // Adaptive threshold
  const maxChange = Math.max(...changes);
  const adaptiveThreshold = Math.min(maxChange * 0.05, config.thresholdPercent);
  const consecutiveRequired = Math.min(config.consecutiveDays, Math.ceil(sorted.length * 0.1));

  let lowChangeCount = 0;

  for (const avg of movingAverages) {
    if (avg <= adaptiveThreshold) {
      lowChangeCount++;
      if (lowChangeCount >= consecutiveRequired) {
        return true;
      }
    } else {
      lowChangeCount = 0;
    }
  }

  return false;
};

/**
 * Find the index where a plateau begins in a DataPoint-like array.
 * Returns -1 if no plateau is found.
 * Used by trimDataAtPlateau in aggregate.ts.
 */
export const findPlateauStartIndex = (
  viewValues: number[],
  minPointsToKeep: number,
): number => {
  if (viewValues.length <= 3) {
    return -1;
  }

  const changes: number[] = [];
  viewValues.forEach((views, i) => {
    if (i > 0) {
      const prev = viewValues[i - 1] ?? 0;
      const absoluteChange = views - prev;
      const relativeChangePercent = prev === 0 ? 100 : (absoluteChange / prev) * 100;
      changes.push(relativeChangePercent);
    }
  });

  const movingAverageWindow = 3;
  const movingAverages: number[] = [];

  changes.forEach((_, i) => {
    const windowStart = Math.max(0, i - movingAverageWindow + 1);
    const windowSize = i - windowStart + 1;
    const sum = changes.slice(windowStart, i + 1).reduce((s, val) => s + val, 0);
    movingAverages.push(sum / windowSize);
  });

  let plateauStartIndex = -1;
  const maxChange = Math.max(...changes);
  const adaptiveThreshold = Math.min(maxChange * 0.05, 1.5);
  const consecutiveRequired = Math.min(4, Math.ceil(viewValues.length * 0.1));
  let lowChangeCount = 0;

  movingAverages.forEach((avg, i) => {
    if (avg <= adaptiveThreshold) {
      lowChangeCount++;
      if (lowChangeCount >= consecutiveRequired && i >= minPointsToKeep - 2) {
        plateauStartIndex = i - lowChangeCount + 2;
      }
    } else {
      lowChangeCount = 0;
    }
  });

  if (plateauStartIndex > 0 && plateauStartIndex < viewValues.length - 2) {
    return plateauStartIndex;
  }

  return -1;
};
