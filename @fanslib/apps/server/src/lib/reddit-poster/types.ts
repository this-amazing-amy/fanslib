export type BrowserConfig = {
  headless?: boolean;
  timeout?: number;
  userDataDir?: string;
};

export type SessionStorage = {
  getPath: () => string;
  exists: () => Promise<boolean>;
  read: () => Promise<string>;
  write: (data: string) => Promise<void>;
  clear: () => Promise<void>;
};

export type RedditPostType = "Link" | "Text" | "Image";

export type RedditPostDraft = {
  type: RedditPostType;
  subreddit: string;
  caption: string;
  url: string | null;
  flair: string | null;
};

export type RedditPostResult = {
  success: boolean;
  url?: string;
  error?: string;
};

export type RedditPostProgressStage =
  | "initializing"
  | "loading"
  | "filling"
  | "submitting"
  | "verifying"
  | "completed"
  | "failed";

export type RedditPostProgress = {
  stage: RedditPostProgressStage;
  message: string;
};

export type RedditLoginResult = {
  success: boolean;
  username?: string;
  error?: string;
};

export type RedditLoginStatus = {
  success: boolean;
  username?: string;
  error?: string;
};

export type RedditPosterConfig = {
  sessionStorage: SessionStorage;
  onProgress?: (progress: RedditPostProgress) => void;
  browserOptions?: BrowserConfig;
  retryOptions?: {
    retries?: number;
    rateLimitDelay?: number;
  };
};

export type RedditLoginHandlerConfig = {
  sessionStorage: SessionStorage;
  onProgress?: (progress: RedditPostProgress) => void;
  browserOptions?: BrowserConfig;
  loginTimeout?: number;
};



