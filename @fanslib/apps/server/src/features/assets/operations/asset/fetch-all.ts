import type { FindOptionsWhere } from "typeorm";
import { db } from "../../../../lib/db";
import { Asset, type AssetType } from "../../entity";

export const fetchAllAssets = async (type?: AssetType): Promise<Asset[]> => {
  const database = await db();
  const repo = database.getRepository(Asset);

  const where: FindOptionsWhere<Asset> = {};
  if (type) where.type = type;

  return repo.find({ where, order: { createdAt: "DESC" } });
};
