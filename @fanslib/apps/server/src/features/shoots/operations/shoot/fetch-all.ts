import type { FetchAllShootsRequest, PaginatedResponse, ShootSummary } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Shoot } from "../../entity";

export const listShoots = async ({
  page = 1,
  limit = 50,
  filter,
}: FetchAllShootsRequest): Promise<PaginatedResponse<ShootSummary>> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  const query = shootRepository
    .createQueryBuilder("shoot")
    .leftJoinAndSelect("shoot.media", "media")
    .leftJoinAndSelect("media.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.post", "post")
    .leftJoinAndSelect("post.channel", "channel")
    .loadRelationCountAndMap("shoot.mediaCount", "shoot.media");

  if (filter?.name) {
    query.andWhere("LOWER(shoot.name) LIKE LOWER(:name)", { name: `%${filter.name}%` });
  }

  if (filter?.startDate) {
    const startOfDay = new Date(filter.startDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    query.andWhere("DATE(shoot.shootDate) >= DATE(:startDate)", {
      startDate: startOfDay,
    });
  }

  if (filter?.endDate) {
    const endOfDay = new Date(filter.endDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    query.andWhere("DATE(shoot.shootDate) <= DATE(:endDate)", {
      endDate: endOfDay,
    });
  }

  const [items, total] = await query
    .skip((page - 1) * limit)
    .take(limit)
    .orderBy("shoot.shootDate", "DESC")
    .getManyAndCount();

  return {
    items: items as (Shoot & { mediaCount: number })[],
    total,
    totalPages: Math.ceil(total / limit),
    page,
    limit,
  };
};

