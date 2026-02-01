import { z } from "zod";
import { unlink } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const ClearFanslyCredentialsResponseSchema = z.object({
  success: z.boolean(),
});

export type ClearFanslyCredentialsResponse = z.infer<typeof ClearFanslyCredentialsResponseSchema>;

export const clearFanslyCredentials = async (): Promise<ClearFanslyCredentialsResponse> => {
  try {
    await unlink(fanslyCredentialsFilePath());
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return { success: true };
    }
    return { success: false };
  }
  return { success: true };
};

