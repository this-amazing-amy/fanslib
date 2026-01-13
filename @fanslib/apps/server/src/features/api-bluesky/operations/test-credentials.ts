import { t } from "elysia";
import { getBlueskyAgent } from "../client";
import { clearSessionCache } from "../client";

export const TestCredentialsResponseSchema = t.Object({
  success: t.Boolean(),
  error: t.Optional(t.String()),
});

export const testCredentials = async (): Promise<typeof TestCredentialsResponseSchema.static> => {
  try {
    clearSessionCache();
    await getBlueskyAgent();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
