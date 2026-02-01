import { z } from "zod";
import { getBlueskyAgent } from "../client";
import { clearSessionCache } from "../client";

export const TestCredentialsResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type TestCredentialsResponse = z.infer<typeof TestCredentialsResponseSchema>;

export const testCredentials = async (): Promise<TestCredentialsResponse> => {
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
