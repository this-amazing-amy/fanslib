import { t } from "elysia";
import { readFile, stat } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const FanslyCredentialsSchema = t.Record(t.String(), t.Any());
export const LoadFanslyCredentialsResponseSchema = t.Union([
  t.Object({
    credentials: FanslyCredentialsSchema,
    lastUpdated: t.Union([t.Number(), t.Null()]),
  }),
  t.Null(),
]);

export const loadFanslyCredentials = async (): Promise<typeof LoadFanslyCredentialsResponseSchema.static> => {
  try {
    const filePath = fanslyCredentialsFilePath();
    const data = await readFile(filePath, "utf8");
    const credentials = JSON.parse(data) as typeof FanslyCredentialsSchema.static;
    
    let lastUpdated: number | null = null;
    if (credentials._lastUpdated && typeof credentials._lastUpdated === 'number') {
      lastUpdated = credentials._lastUpdated;
    } else {
      try {
        const stats = await stat(filePath);
        lastUpdated = stats.mtimeMs;
      } catch {
        // Ignore stat errors
      }
    }

    const { _lastUpdated, ...credentialsWithoutMeta } = credentials;

    return {
      credentials: credentialsWithoutMeta,
      lastUpdated,
    };
  } catch {
    return null;
  }
};

