import { db } from "../../../../lib/db";
import { Asset } from "../../entity";

export const fetchAssetById = async (id: string): Promise<Asset | null> => {
  const database = await db();
  const repo = database.getRepository(Asset);
  return repo.findOne({ where: { id } });
};
