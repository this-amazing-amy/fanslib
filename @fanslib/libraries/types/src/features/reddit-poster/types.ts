import type { Subreddit } from '../channels/types';
import type { Media } from '../library/types';

export type GeneratedPost = {
  id: string;
  subreddit: Subreddit;
  media: Media;
  caption: string;
  date: Date;
};

export type ScheduledPost = {
  id: string;
  subreddit: Subreddit;
  media: Media;
  caption: string;
  scheduledDate: string;
  createdAt: string;
  serverJobId?: string;
  status?: "queued" | "processing" | "posted" | "failed";
  errorMessage?: string;
  postUrl?: string;
};

export type RegenerateMediaResult = {
  media: Media;
  caption: string;
};

