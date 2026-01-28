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
    
    const lastUpdated =
      credentials._lastUpdated && typeof credentials._lastUpdated === "number"
        ? credentials._lastUpdated
        : await stat(filePath)
            .then((stats) => stats.mtimeMs)
            .catch(() => null);

    const { _lastUpdated, ...credentialsWithoutMeta } = credentials;

    return {
      credentials: credentialsWithoutMeta,
      lastUpdated,
    };
  } catch {
    return null;
  }
};

