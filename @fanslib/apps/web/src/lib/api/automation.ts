import { eden } from './eden';

export type PostToRedditRequest = {
  subredditId: string;
  mediaId: string;
  caption: string;
};

export type PostToRedditResponse = {
  success: boolean;
  url?: string;
  error?: string;
};

export type IsAutomationRunningResponse = {
  isRunning: boolean;
};

export const automationApi = {
  postToReddit: (request: PostToRedditRequest) =>
    eden.api['reddit-automation']['post-to-reddit'].post(request),

  isRunning: () =>
    eden.api['reddit-automation']['is-running'].get(),
};
