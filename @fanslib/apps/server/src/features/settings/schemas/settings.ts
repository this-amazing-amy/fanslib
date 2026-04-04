import { z } from "zod";

export const CaptionAnimationSchema = z.enum([
  "typewriter",
  "fade-in",
  "scale-in",
  "slide-up",
]);

export const CaptionStylePresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  fontSize: z.number(),
  fontFamily: z.string().optional(),
  color: z.string(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().optional(),
  animation: CaptionAnimationSchema,
});

export type CaptionStylePreset = z.infer<typeof CaptionStylePresetSchema>;

export const SettingsSchema = z.object({
  theme: z.union([z.literal("light"), z.literal("dark")]),
  blueskyUsername: z.string().optional(),
  blueskyAppPassword: z.string().optional(),
  postponeToken: z.string().optional(),
  blueskyDefaultExpiryDays: z.number().optional(),
  sfwMode: z.boolean(),
  sfwBlurIntensity: z.number(),
  sfwDefaultMode: z.union([z.literal("off"), z.literal("on"), z.literal("remember")]),
  sfwHoverDelay: z.number(),
  backgroundJobsServerUrl: z.string().optional(),
  mediaPath: z.string().optional(),
  libraryPath: z.string().optional(),
  repostSettings: z
    .object({
      useAnalytics: z.boolean(),
      plateauConsecutiveDays: z.number().int(),
      plateauThresholdPercent: z.number(),
      minDatapointsForPlateau: z.number().int(),
      defaultMediaRepostCooldownHours: z.number().int(),
    })
    .optional(),
  captionStylePresets: z.array(CaptionStylePresetSchema).optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;
