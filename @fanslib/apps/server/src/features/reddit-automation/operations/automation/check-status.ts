import { getPosterInstance, hasPosterInstance } from "../../../../lib/reddit-poster/poster-instance";

export const isRedditAutomationRunning = (): boolean => {
  if (!hasPosterInstance()) {
    return false;
  }

  const posterInstance = getPosterInstance();
  return posterInstance.isCurrentlyRunning();
};

