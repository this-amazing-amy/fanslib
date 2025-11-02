import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const getSnippetsByChannel = async (channelId: string): Promise<CaptionSnippet[]> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  return repo.find({
    where: [
      { channelId },
      { channelId: IsNull() },
    ],
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
};

