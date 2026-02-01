import { z } from "zod";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagSchema } from "../../entity";
import { normalizeHashtagName } from "./helpers";

export const FindOrCreateHashtagRequestBodySchema = z.object({
  name: z.string(),
});

export const FindOrCreateHashtagsByIdsRequestBodySchema = z.object({
  names: z.array(z.string()),
});

export const FindOrCreateHashtagResponseSchema = HashtagSchema;
export const FindOrCreateHashtagsByIdsResponseSchema = z.array(HashtagSchema);

export const findOrCreateHashtag = async (name: string): Promise<z.infer<typeof FindOrCreateHashtagResponseSchema>> => {
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

export const findOrCreateHashtags = async (names: string[]): Promise<z.infer<typeof FindOrCreateHashtagsByIdsResponseSchema>> =>
  Promise.all(names.map((name) => findOrCreateHashtag(name)));

