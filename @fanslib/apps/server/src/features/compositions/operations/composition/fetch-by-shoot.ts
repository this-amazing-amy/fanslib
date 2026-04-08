import { db } from "../../../../lib/db";
import { Composition } from "../../entity";

export const fetchCompositionsByShoot = async (shootId: string): Promise<Composition[]> => {
  const database = await db();
  const repo = database.getRepository(Composition);
  return repo.find({
    where: { shootId },
    order: { createdAt: "DESC" },
  });
};
