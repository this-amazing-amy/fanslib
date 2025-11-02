import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const deleteSnippet = async (id: string): Promise<void> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  await repo.delete(id);
};

