import { z } from "zod";
import { readFile, stat } from "fs/promises";
import { fanslyCredentialsFilePath } from "../../../../lib/env";

export const FanslyCredentialsSchema = z.record(z.string(), z.unknown());

export const LoadFanslyCredentialsResponseSchema = z.union([
  z.object({
    credentials: FanslyCredentialsSchema,
    lastUpdated: z.union([z.number(), z.null()]),
    stale: z.boolean(),
  }),
  z.null(),
]);

export type LoadFanslyCredentialsResponse = z.infer<typeof LoadFanslyCredentialsResponseSchema>;

export const loadFanslyCredentials = async (): Promise<LoadFanslyCredentialsResponse> => {
  try {
    const filePath = fanslyCredentialsFilePath();
    const data = await readFile(filePath, "utf8");
    const credentials = JSON.parse(data) as Record<string, unknown>;

    const lastUpdated =
      credentials._lastUpdated && typeof credentials._lastUpdated === "number"
        ? credentials._lastUpdated
        : await stat(filePath)
            .then((stats) => stats.mtimeMs)
            .catch(() => null);

    const stale = credentials._stale === true;

    const { _lastUpdated, _stale, ...credentialsWithoutMeta } = credentials;

    return {
      credentials: credentialsWithoutMeta,
      lastUpdated,
      stale,
    };
  } catch {
    return null;
  }
};
