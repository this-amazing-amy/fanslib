import { z } from "zod";

export const SettingsSchema = z.object({
  theme: z.union([z.literal("light"), z.literal("dark")]),
  blueskyUsername: z.string().optional(),
  blueskyAppPassword: z.string().optional(),
  postponeToken: z.string().optional(),
  blueskyDefaultExpiryDays: z.number().optional(),
  sfwMode: z.boolean(),
  sfwBlurIntensity: z.number(),
  sfwDefaultMode: z.union([
    z.literal("off"),
    z.literal("on"),
    z.literal("remember"),
  ]),
  sfwHoverDelay: z.number(),
  backgroundJobsServerUrl: z.string().optional(),
  libraryPath: z.string().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;