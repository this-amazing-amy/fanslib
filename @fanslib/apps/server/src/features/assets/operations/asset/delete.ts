import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { db } from "../../../../lib/db";
import { appdataPath } from "../../../../lib/env";
import { Asset } from "../../entity";

export const deleteAsset = async (id: string): Promise<boolean> => {
  const database = await db();
  const repo = database.getRepository(Asset);

  const asset = await repo.findOne({ where: { id } });
  if (!asset) return false;

  // Delete file from disk
  const filePath = join(appdataPath(), "assets", asset.filename);
  if (existsSync(filePath)) unlinkSync(filePath);

  await repo.delete(id);
  return true;
};
