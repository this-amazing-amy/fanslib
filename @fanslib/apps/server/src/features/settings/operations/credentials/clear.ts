import { t } from "elysia";
import { unlink } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const ClearFanslyCredentialsResponseSchema = t.Object({
  success: t.Boolean(),
});

export const clearFanslyCredentials = async (): Promise<typeof ClearFanslyCredentialsResponseSchema.static> => {
  try {
    await unlink(fanslyCredentialsFilePath());
  } catch {
    return { success: false };
  }
  return { success: true };
};

