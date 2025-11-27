import { getTestDataSource } from "../../lib/db.test";
import type { Media } from "../library/entity";
import { MediaTag as MediaTagEntity, TagDefinition as TagDefinitionEntity, TagDimension as TagDimensionEntity } from "./entity";

type MediaTag = MediaTagEntity;
type TagDefinition = TagDefinitionEntity;
type TagDimension = TagDimensionEntity;

export type TagDimensionFixture = Omit<TagDimension, "id" | "createdAt" | "updatedAt" | "validationSchema">;

export const TAG_DIMENSION_FIXTURES: TagDimensionFixture[] = [
  {
    name: "Rating",
    description: "Content rating",
    dataType: "categorical",
    sortOrder: 0,
    stickerDisplay: "color",
    isExclusive: true,
    tags: [],
  },
  {
    name: "Category",
    description: "Content category",
    dataType: "categorical",
    sortOrder: 1,
    stickerDisplay: "short",
    isExclusive: false,
    tags: [],
  },
  {
    name: "Duration",
    description: "Media duration in seconds",
    dataType: "numerical",
    sortOrder: 2,
    stickerDisplay: "none",
    isExclusive: false,
    tags: [],
  },
];

export type TagDefinitionFixture = Omit<TagDefinition, "id" | "dimensionId" | "createdAt" | "updatedAt" | "description" | "metadata" | "shortRepresentation" | "parentTagId" | "dimension" | "children" | "mediaTags"> & {
  dimensionName: string;
};

export const TAG_DEFINITION_FIXTURES: TagDefinitionFixture[] = [
  { dimensionName: "Rating", value: "5", displayName: "5 Stars", color: "#FFD700", sortOrder: 0 },
  { dimensionName: "Rating", value: "4", displayName: "4 Stars", color: "#FFA500", sortOrder: 1 },
  { dimensionName: "Category", value: "portrait", displayName: "Portrait", color: "#FF6B6B", sortOrder: 0 },
  { dimensionName: "Category", value: "landscape", displayName: "Landscape", color: "#4ECDC4", sortOrder: 1 },
  { dimensionName: "Category", value: "studio", displayName: "Studio", color: "#6C5CE7", sortOrder: 2 },
  { dimensionName: "Category", value: "outdoor", displayName: "Outdoor", color: "#00B894", sortOrder: 3 },
  { dimensionName: "Category", value: "macro", displayName: "Macro", color: "#E84393", sortOrder: 4 },
];

export type MediaTagFixture = Pick<MediaTag, "mediaId" | "dimensionName" | "tagValue" | "source">;

export const MEDIA_TAG_FIXTURES: MediaTagFixture[] = [
  { mediaId: "media-1", dimensionName: "Rating", tagValue: "5", source: "manual" },
  { mediaId: "media-1", dimensionName: "Category", tagValue: "portrait", source: "manual" },
  { mediaId: "media-2", dimensionName: "Rating", tagValue: "4", source: "automated" },
  { mediaId: "media-3", dimensionName: "Category", tagValue: "landscape", source: "manual" },
];

export const seedTagFixtures = async (media: Media[]) => {
  const dataSource = getTestDataSource();
  const dimensionRepo = dataSource.getRepository(TagDimensionEntity);
  const definitionRepo = dataSource.getRepository(TagDefinitionEntity);
  const mediaTagRepo = dataSource.getRepository(MediaTagEntity);

  const createdDimensions = await Promise.all(
    TAG_DIMENSION_FIXTURES.map(async (fixture) => {
      const existing = await dimensionRepo.findOne({ where: { name: fixture.name } });
      if (existing) {
        return existing;
      }
      const dimension = dimensionRepo.create({
        name: fixture.name,
        description: fixture.description,
        dataType: fixture.dataType,
        sortOrder: fixture.sortOrder,
        stickerDisplay: fixture.stickerDisplay,
        isExclusive: fixture.isExclusive,
      });
      return dimensionRepo.save(dimension);
    })
  );

  const createdDefinitions = await Promise.all(
    TAG_DEFINITION_FIXTURES.map(async (fixture) => {
      const dimension = createdDimensions.find((d) => d.name === fixture.dimensionName);
      if (!dimension) {
        return null;
      }

      const existing = await definitionRepo.findOne({
        where: { dimensionId: dimension.id, value: fixture.value },
      });
      if (existing) {
        return existing;
      }

      const definition = definitionRepo.create({
        dimensionId: dimension.id,
        value: fixture.value,
        displayName: fixture.displayName,
        color: fixture.color,
        sortOrder: fixture.sortOrder,
      });
      return definitionRepo.save(definition);
    })
  ).then((defs) => defs.filter((d) => d !== null) as TagDefinition[]);

  const definitionsWithDimension = await definitionRepo.find({
    where: createdDefinitions.map((d) => (d !== null ? { id: d.id } : null)).filter((d): d is { id: number } => d !== null),
    relations: { dimension: true },
  });

  await Promise.all(
    MEDIA_TAG_FIXTURES.map(async (fixture) => {
      const mediaItem = media.find((m) => m.id === fixture.mediaId);
      const dimension = createdDimensions.find((d) => d.name === fixture.dimensionName);
      const definition = definitionsWithDimension.find(
        (d) => d.value === fixture.tagValue && d.dimensionId === dimension?.id
      );

      if (!mediaItem || !definition || !dimension) {
        return;
      }

      const existing = await mediaTagRepo.findOne({
        where: { mediaId: mediaItem.id, tagDefinitionId: definition.id },
      });

      if (!existing) {
        const dimensionName = definition.dimension?.name ?? dimension.name;
        const dataType = definition.dimension?.dataType ?? dimension.dataType;
        const stickerDisplay = definition.dimension?.stickerDisplay ?? dimension.stickerDisplay;

        const mediaTag = mediaTagRepo.create({
          mediaId: mediaItem.id,
          tagDefinitionId: definition.id,
          dimensionId: definition.dimensionId,
          dimensionName,
          dataType,
          tagValue: definition.value,
          tagDisplayName: definition.displayName,
          color: definition.color,
          stickerDisplay,
          shortRepresentation: definition.shortRepresentation,
          numericValue: dataType === "numerical" ? parseFloat(definition.value) : undefined,
          booleanValue: dataType === "boolean" ? definition.value === "true" : undefined,
          source: fixture.source,
        });
        await mediaTagRepo.save(mediaTag);
      }
    })
  );

  return {
    tagDimensions: await dimensionRepo.find(),
    tagDefinitions: await definitionRepo.find({ relations: { dimension: true } }),
    mediaTags: await mediaTagRepo.find({ relations: { media: true, tag: true } }),
  };
};

