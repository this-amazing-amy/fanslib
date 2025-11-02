import { join } from "path";
import { RedditPoster } from "./poster";
import { createFileSessionStorage } from "./session-storage";

const BROWSER_DATA_DIR = process.env.BROWSER_DATA_DIR ?? join(process.cwd(), "browser-data");

// eslint-disable-next-line functional/no-let
let posterInstance: RedditPoster | null = null;

export const getPosterInstance = (): RedditPoster => {
  if (!posterInstance) {
    const sessionStorage = createFileSessionStorage(BROWSER_DATA_DIR);

    posterInstance = new RedditPoster({
      sessionStorage,
      onProgress: (progress) => {
        console.log(`[Reddit Automation] ${progress.stage}: ${progress.message}`);
      },
      browserOptions: {
        headless: false,
        timeout: 180000,
      },
      retryOptions: {
        retries: 3,
        rateLimitDelay: 60000,
      },
    });
  }

  return posterInstance;
};

export const hasPosterInstance = (): boolean => posterInstance !== null;

