import { z } from "zod";
import { db } from "../../../../lib/db";
import { Asset } from "../../entity";

export const UpdateAssetRequestBodySchema = z.object({
  name: z.string(),
});

export const updateAsset = async (
  id: string,
  payload: z.infer<typeof UpdateAssetRequestBodySchema>,
): Promise<Asset | null> => {
  const database = await db();
  const repo = database.getRepository(Asset);

  const asset = await repo.findOne({ where: { id } });
  if (!asset) return null;

  asset.name = payload.name;
  await repo.save(asset);

  return repo.findOne({ where: { id } });
};
