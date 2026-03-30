import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { db } from "../../../../lib/db";
import { appdataPath } from "../../../../lib/env";
import { Asset } from "../../entity";

const getAssetsDir = (): string => {
  const dir = join(appdataPath(), "assets");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
};

export const uploadAsset = async (
  file: File,
  name: string,
): Promise<Asset> => {
  const database = await db();
  const repo = database.getRepository(Asset);

  const ext = file.name?.split(".").pop() ?? "png";
  const filename = `${randomUUID()}.${ext}`;
  const assetsDir = getAssetsDir();
  const filePath = join(assetsDir, filename);

  const buffer = await file.arrayBuffer();
  await Bun.write(filePath, buffer);

  const asset = repo.create({
    name,
    type: "image",
    filename,
  });
  await repo.save(asset);

  const created = await repo.findOne({ where: { id: asset.id } });
  if (!created) throw new Error(`Failed to fetch created asset with id ${asset.id}`);
  return created;
};
