import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const getAllSnippets = async (): Promise<CaptionSnippet[]> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  return repo.find({
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
};

