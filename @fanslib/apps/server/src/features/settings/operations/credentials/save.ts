import { z } from "zod";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { fanslyCredentialsFilePath } from "../../../../lib/env";
import { loadFanslyCredentials } from "./load";

export const SaveFanslyCredentialsRequestBodySchema = z.object({
  fanslyAuth: z.string().optional(),
  fanslySessionId: z.string().optional(),
  fanslyClientCheck: z.string().optional(),
  fanslyClientId: z.string().optional(),
});

export const SaveFanslyCredentialsResponseSchema = z.object({
  success: z.boolean(),
});

export type SaveFanslyCredentialsRequestBody = z.infer<typeof SaveFanslyCredentialsRequestBodySchema>;
export type SaveFanslyCredentialsResponse = z.infer<typeof SaveFanslyCredentialsResponseSchema>;

export const saveFanslyCredentials = async (
  credentials: SaveFanslyCredentialsRequestBody
): Promise<SaveFanslyCredentialsResponse> => {
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

