import { In } from "typeorm";
import { db } from "../../../lib/db";
import { MediaTag, TagDefinition, TagDimension } from "../entity";

export const TAG_COLORS = [
  "preset:pink",
  "preset:peach",
  "preset:yellow",
  "preset:lime",
  "preset:aqua",
  "preset:periwinkle",
  "preset:lilac",
];

export const populateDenormalizedFields = (
  mediaTag: Partial<MediaTag>,
  tagDefinition: TagDefinition
): void => {
  if (!tagDefinition.dimension) {
    throw new Error(
      `TagDefinition ${tagDefinition.id} does not have dimension relation loaded`
    );
  }

  mediaTag.dimensionId = tagDefinition.dimensionId;
  mediaTag.dimensionName = tagDefinition.dimension.name;
  mediaTag.dataType = tagDefinition.dimension.dataType;
  mediaTag.tagValue = tagDefinition.value;
  mediaTag.tagDisplayName = tagDefinition.displayName;

  mediaTag.color = tagDefinition.color ?? undefined;

  mediaTag.stickerDisplay = tagDefinition.dimension.stickerDisplay ?? "none";
  mediaTag.shortRepresentation = tagDefinition.shortRepresentation ?? undefined;

  if (tagDefinition.dimension.dataType === "numerical") {
    const numericValue = parseFloat(tagDefinition.value);
    mediaTag.numericValue = isNaN(numericValue) ? undefined : numericValue;
  } else if (tagDefinition.dimension.dataType === "boolean") {
    mediaTag.booleanValue = tagDefinition.value.toLowerCase() === "true";
  }
};

export const assignColorForCategoricalTag = async (
  dimensionId: number,
  providedColor?: string
): Promise<string | undefined> => {
  const dataSource = await db();
  const dimensionRepository = dataSource.getRepository(TagDimension);
  const tagRepository = dataSource.getRepository(TagDefinition);

  const dimension = await dimensionRepository.findOne({ where: { id: dimensionId } });

  if (dimension?.dataType !== "categorical") {
    return providedColor;
  }

  if (providedColor) {
    return providedColor;
  }

  const existingTags = await tagRepository.find({
    where: { dimensionId },
    select: ["color"],
  });

  const usedColors = new Set(
    existingTags
      .map((tag) => tag.color)
      .filter((color) => color !== null && color !== undefined)
  );

  return TAG_COLORS.find((color) => !usedColors.has(color)) ?? TAG_COLORS[existingTags.length % TAG_COLORS.length];
};

export const validateExistingAssignments = async (dimensionId: number): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  const violations = await repository
    .createQueryBuilder("mt")
    .select("mt.mediaId")
    .where("mt.dimensionId = :dimensionId", { dimensionId })
    .groupBy("mt.mediaId")
    .having("COUNT(*) > 1")
    .getRawMany();

  if (violations.length > 0) {
    throw new Error(
      `Cannot make dimension exclusive: ${violations.length} media items have multiple tags in this dimension`
    );
  }
};

export const syncDenormalizedFieldsForTag = async (tagDefinitionId: number): Promise<void> => {
  const dataSource = await db();
  const mediaTagRepository = dataSource.getRepository(MediaTag);
  const tagDefinitionRepository = dataSource.getRepository(TagDefinition);

  const tagDefinition = await tagDefinitionRepository
    .createQueryBuilder("td")
    .leftJoinAndSelect("td.dimension", "dim")
    .where("td.id = :id", { id: tagDefinitionId })
    .getOne();

  if (!tagDefinition?.dimension) {
    return;
  }

  const mediaTags = await mediaTagRepository.find({
    where: { tagDefinitionId },
  });

  mediaTags.forEach((mediaTag) => {
    populateDenormalizedFields(mediaTag, tagDefinition);
  });

  if (mediaTags.length > 0) {
    await mediaTagRepository.save(mediaTags);
  }
};

export const syncDenormalizedFieldsForDimension = async (dimensionId: number): Promise<void> => {
  const dataSource = await db();
  const mediaTagRepository = dataSource.getRepository(MediaTag);
  const tagDefinitionRepository = dataSource.getRepository(TagDefinition);

  const tagDefinitions = await tagDefinitionRepository.find({
    where: { dimensionId },
    relations: ["dimension"],
  });

  if (tagDefinitions.length === 0) {
    return;
  }

  const tagDefinitionIds = tagDefinitions.map((tag) => tag.id);
  const mediaTags = await mediaTagRepository.find({
    where: { tagDefinitionId: In(tagDefinitionIds) },
  });

  mediaTags.forEach((mediaTag) => {
    const tagDefinition = tagDefinitions.find((tag) => tag.id === mediaTag.tagDefinitionId);
    if (tagDefinition) {
      populateDenormalizedFields(mediaTag, tagDefinition);
    }
  });

  if (mediaTags.length > 0) {
    await mediaTagRepository.save(mediaTags);
  }
};

type TagDefinitionHierarchyNode = Pick<TagDefinition, "id" | "parentTagId">;

export const buildTagHierarchyIndex = (tagDefinitions: TagDefinitionHierarchyNode[]): Map<number | null, number[]> => tagDefinitions.reduce<Map<number | null, number[]>>((index, tag) => {
    const parentId = tag.parentTagId ?? null;
    const existingChildren = index.get(parentId) ?? [];

    index.set(parentId, [...existingChildren, tag.id]);

    return index;
  }, new Map());

export const getDescendantTagIds = (
  rootTagIds: number[],
  tagDefinitions: TagDefinitionHierarchyNode[]
): number[] => {
  if (rootTagIds.length === 0 || tagDefinitions.length === 0) {
    return [];
  }

  const hierarchyIndex = buildTagHierarchyIndex(tagDefinitions);
  const visited = new Set<number>();

  const collectDescendants = (tagId: number): void => {
    const children = hierarchyIndex.get(tagId) ?? [];

    children
      .filter((childId) => !visited.has(childId))
      .forEach((childId) => {
        visited.add(childId);
        collectDescendants(childId);
      });
  };

  rootTagIds.forEach((rootId) => collectDescendants(rootId));

  return Array.from(visited);
};

export const fetchAllTagDefinitionsForHierarchy = async (): Promise<TagDefinitionHierarchyNode[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const tagDefinitions = await repository.find({
    select: ["id", "parentTagId"],
  });

  return tagDefinitions;
};


