import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition } from "../../entity";

export const deleteTagDefinition = async (id: number): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);
  const mediaTagRepository = dataSource.getRepository(MediaTag);

  const associatedMediaTags = await mediaTagRepository.find({
    where: { tagDefinitionId: id },
  });

  if (associatedMediaTags.length > 0) {
    await mediaTagRepository.remove(associatedMediaTags);
    console.log(
      `🧹 Removed ${associatedMediaTags.length} MediaTag entries associated with TagDefinition ${id}`
    );
  }

  await repository.delete(id);
};

