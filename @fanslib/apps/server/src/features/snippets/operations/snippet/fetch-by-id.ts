import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const getSnippetById = async (id: string): Promise<CaptionSnippet | null> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  return repo.findOne({
    where: { id },
    relations: ["channel"],
  });
};

