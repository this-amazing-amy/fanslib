import { api } from './hono-client';

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
  postToReddit: async (request: PostToRedditRequest) => {
    const response = await api.api['reddit-automation']['post-to-reddit'].$post({ json: request });
    return response.json();
  },

  isRunning: async () => {
    const response = await api.api['reddit-automation']['is-running'].$get();
    return response.json();
  },
};
