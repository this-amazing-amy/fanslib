import { t } from "elysia";

export const SettingsSchema = t.Object({
  theme: t.Union([t.Literal("light"), t.Literal("dark")]),
  blueskyUsername: t.Optional(t.String()),
  postponeToken: t.Optional(t.String()),
  blueskyDefaultExpiryDays: t.Optional(t.Number()),
  sfwMode: t.Boolean(),
  sfwBlurIntensity: t.Number(),
  sfwDefaultMode: t.Union([t.Literal("off"), t.Literal("on"), t.Literal("remember")]),
  sfwHoverDelay: t.Number(),
  backgroundJobsServerUrl: t.Optional(t.String()),
});