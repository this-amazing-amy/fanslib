import { t } from "elysia";
import { db } from "../../../../lib/db";
import { paginatedResponseSchema } from "../../../../lib/pagination";
import { Shoot, ShootSchema } from "../../entity";

export const ShootFiltersSchema = t.Object({
  name: t.Optional(t.String()),
  startDate: t.Optional(t.Date()),
  endDate: t.Optional(t.Date()),
});

export const FetchAllShootsRequestBodySchema = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
  filter: t.Optional(ShootFiltersSchema),
});

export const FetchAllShootsResponseSchema = paginatedResponseSchema(t.Intersect([ShootSchema, t.Object({ mediaCount: t.Number() })]));

export const listShoots = async (payload: typeof FetchAllShootsRequestBodySchema.static): Promise<typeof FetchAllShootsResponseSchema.static> => {
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

