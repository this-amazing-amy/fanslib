import { db } from "../../../../lib/db";
import { Hashtag } from "../../entity";
import { normalizeHashtagName } from "./helpers";

export const findOrCreateHashtag = async (name: string): Promise<Hashtag> => {
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

export const findOrCreateHashtags = async (names: string[]): Promise<Hashtag[]> =>
  Promise.all(names.map((name) => findOrCreateHashtag(name)));

