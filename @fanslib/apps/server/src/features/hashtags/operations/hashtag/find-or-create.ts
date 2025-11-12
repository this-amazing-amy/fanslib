import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagSchema } from "../../entity";
import { normalizeHashtagName } from "./helpers";

export const FindOrCreateHashtagRequestBodySchema = t.Object({
  name: t.String(),
});

export const FindOrCreateHashtagsByIdsRequestBodySchema = t.Object({
  names: t.Array(t.String()),
});

export const FindOrCreateHashtagResponseSchema = HashtagSchema;
export const FindOrCreateHashtagsByIdsResponseSchema = t.Array(HashtagSchema);

export const findOrCreateHashtag = async (name: string): Promise<typeof FindOrCreateHashtagResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);
  const normalizedName = normalizeHashtagName(name);

  const existingHashtag = await repository.findOne({
    where: { name: normalizedName },
  });

  if (existingHashtag) {
    return existingHashtag;
  }

  const hashtag = repository.create({ name: normalizedName });
  return repository.save(hashtag);
};

export const findOrCreateHashtags = async (names: string[]): Promise<typeof FindOrCreateHashtagsByIdsResponseSchema.static> =>
  Promise.all(names.map((name) => findOrCreateHashtag(name)));

