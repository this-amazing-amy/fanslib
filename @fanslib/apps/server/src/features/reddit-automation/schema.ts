import { z } from "zod";

// Request/Response schemas for routes

export const IsRunningResponseSchema = z.object({
  isRunning: z.boolean(),
});

export const GenerateRandomPostRequestBodySchema = z.object({
  subreddits: z.array(z.any()),
  channelId: z.string(),
});

export const GenerateRandomPostResponseSchema = z.any();

export const GeneratePostsRequestBodySchema = z.object({
  count: z.number(),
  subreddits: z.array(z.any()),
  channelId: z.string(),
});

export const GeneratePostsResponseSchema = z.array(z.any());

export const RegenerateMediaRequestBodySchema = z.object({
  subredditId: z.string(),
  channelId: z.string(),
});

export const RegenerateMediaResponseSchema = z.any();

export const SchedulePostsRequestBodySchema = z.object({
  posts: z.array(z.any()),
});

export const SchedulePostsResponseSchema = z.array(z.string());

export const GetScheduledPostsResponseSchema = z.array(z.any());

export const PostToRedditRequestBodySchema = z.object({
  subredditId: z.string(),
  mediaId: z.string(),
  caption: z.string(),
});

export const PostToRedditResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().optional(),
  error: z.string().optional(),
});

export const LoginRequestBodySchema = z.object({
  userId: z.string().optional(),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
});

export const CheckLoginRequestBodySchema = z.object({
  userId: z.string().optional(),
});

export const CheckLoginResponseSchema = z.object({
  isLoggedIn: z.boolean(),
  username: z.string().optional(),
});

export const SessionStatusRequestBodySchema = z.object({
  userId: z.string().optional(),
});

export const SessionStatusResponseSchema = z.object({
  hasSession: z.boolean(),
  isValid: z.boolean(),
});

export const ClearSessionRequestBodySchema = z.object({
  userId: z.string().optional(),
});

export const ClearSessionResponseSchema = z.object({
  success: z.boolean(),
});
