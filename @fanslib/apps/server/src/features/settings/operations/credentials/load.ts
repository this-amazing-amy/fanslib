import { t } from "elysia";
import { readFile } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const FanslyCredentialsSchema = t.Record(t.String(), t.Any());
export const LoadFanslyCredentialsResponseSchema = t.Union([FanslyCredentialsSchema, t.Null()]);

export const loadFanslyCredentials = async (): Promise<typeof LoadFanslyCredentialsResponseSchema.static> => {
  try {
    const data = await readFile(fanslyCredentialsFilePath(), "utf8");
    return JSON.parse(data) as typeof FanslyCredentialsSchema.static;
  } catch {
    return null;
  }
};

