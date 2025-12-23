import { t } from "elysia";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { fanslyCredentialsFilePath } from "../../../../lib/env";
import { FanslyCredentialsSchema, loadFanslyCredentials } from "./load";

export const SaveFanslyCredentialsRequestBodySchema = t.Object({
  fanslyAuth: t.Optional(t.String()),
  fanslySessionId: t.Optional(t.String()),
  fanslyClientCheck: t.Optional(t.String()),
  fanslyClientId: t.Optional(t.String()),
});
export const SaveFanslyCredentialsResponseSchema = t.Object({
  success: t.Boolean(),
});

export const saveFanslyCredentials = async (
  credentials: typeof SaveFanslyCredentialsRequestBodySchema.static
): Promise<typeof SaveFanslyCredentialsResponseSchema.static> => {
  try {
    const existingData = await loadFanslyCredentials();
    const existingCredentials = existingData?.credentials ?? {};
    
    const updatedCredentials = { 
      ...existingCredentials, 
      ...credentials,
      _lastUpdated: Date.now(),
    };

    await mkdir(dirname(fanslyCredentialsFilePath()), { recursive: true });
    await writeFile(fanslyCredentialsFilePath(), JSON.stringify(updatedCredentials, null, 2));
  } catch (error) {
    console.error("Error saving Fansly credentials:", error);
    return { success: false };
  }
  return { success: true };
};

