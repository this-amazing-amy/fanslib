import type { PostToRedditPayload } from '@fanslib/types';
import { apiRequest } from './client';

export type PostToRedditRequest = PostToRedditPayload;

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
    apiRequest<PostToRedditResponse>('/api/automation/post-to-reddit', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  isRunning: () =>
    apiRequest<IsAutomationRunningResponse>('/api/automation/is-running'),
};

