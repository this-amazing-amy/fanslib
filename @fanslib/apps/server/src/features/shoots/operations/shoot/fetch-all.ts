import { z } from "zod";
import { db } from "../../../../lib/db";
import { paginatedResponseSchema } from "../../../../lib/pagination";
import { MediaSchema } from "../../../library/schema";
import { Shoot, ShootSchema } from "../../entity";

export const ShootFiltersSchema = z.object({
  name: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const FetchAllShootsRequestBodySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  filter: ShootFiltersSchema.optional(),
});

export const ShootSummarySchema = ShootSchema.extend({ 
  mediaCount: z.number(),
  media: z.array(MediaSchema),
});

export const FetchAllShootsResponseSchema = paginatedResponseSchema(ShootSummarySchema);

export const listShoots = async (payload: z.infer<typeof FetchAllShootsRequestBodySchema>): Promise<z.infer<typeof FetchAllShootsResponseSchema>> => {
  const { page = 1, limit = 50, filter } = payload;
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

