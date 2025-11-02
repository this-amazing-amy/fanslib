import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const getGlobalSnippets = async (): Promise<CaptionSnippet[]> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  return repo.find({
    where: { channelId: IsNull() },
    order: { updatedAt: "DESC" },
  });
};

