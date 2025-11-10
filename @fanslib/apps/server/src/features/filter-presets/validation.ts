import { MediaFilterSchema } from "../library/schemas/media-filter";
import { db } from "../../lib/db";
import { Channel } from "../channels/entity";
import { Shoot } from "../shoots/entity";
import { TagDefinition } from "../tags/entity";

type MediaFilters = typeof MediaFilterSchema.static;
type FilterGroup = MediaFilters[number];
type FilterItem = FilterGroup['items'][number];

const validateFilterItem = async (item: FilterItem): Promise<boolean> => {
  const database = await db();

  switch (item.type) {
    case "channel": {
      if (!item.id) return false;
      const channel = await database.manager.findOne(Channel, { where: { id: item.id } });
      return !!channel;
    }
    case "subreddit": {
      if (!item.id) return false;
      const subreddit = await database.manager.findOne(Channel, {
        where: { id: item.id },
        relations: { type: true },
      });
      return !!subreddit && subreddit.type?.name === "reddit";
    }
    case "tag": {
      if (!item.id) return false;
      const tag = await database.manager.findOne(TagDefinition, {
        where: { id: parseInt(item.id) },
      });
      return !!tag;
    }
    case "shoot": {
      if (!item.id) return false;
      const shoot = await database.manager.findOne(Shoot, { where: { id: item.id } });
      return !!shoot;
    }
    case "filename":
    case "caption":
    case "posted":
    case "mediaType":
    case "createdDateStart":
    case "createdDateEnd":
    case "dimensionEmpty":
      return true;
    default:
      return false;
  }
};

export const validateAndCleanFilters = async (filters: MediaFilters): Promise<MediaFilters> => {
  const cleanedFilters: Array<{ include: boolean; items: FilterItem[] }> = [];

  // eslint-disable-next-line functional/no-loop-statements
  for (const group of filters) {
    const validItems: FilterItem[] = [];

    // eslint-disable-next-line functional/no-loop-statements
    for (const item of group.items) {
      const isValid = await validateFilterItem(item);
      if (isValid) {
        validItems.push(item);
      }
    }

    if (validItems.length > 0) {
      cleanedFilters.push({
        include: group.include,
        items: validItems,
      });
    }
  }

  return cleanedFilters;
};



