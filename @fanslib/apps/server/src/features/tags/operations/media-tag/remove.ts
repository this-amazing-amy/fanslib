import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag } from "../../entity";

export const removeTagsFromMedia = async (mediaId: string, tagIds: number[]): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  await repository.delete({
    mediaId,
    tagDefinitionId: In(tagIds),
  });
};

