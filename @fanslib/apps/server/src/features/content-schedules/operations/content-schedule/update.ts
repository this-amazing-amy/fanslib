import type { UpdateContentScheduleRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const updateContentSchedule = async (
  id: string,
  updates: UpdateContentScheduleRequest
): Promise<ContentSchedule | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedule = await repository.findOne({
    where: { id },
    relations: {
      channel: true,
    },
  });

  if (!schedule) return null;

  const mediaFiltersString =
    "mediaFilters" in updates
      ? updates.mediaFilters === null
        ? undefined
        : updates.mediaFilters
          ? stringifyMediaFilters(updates.mediaFilters)
          : undefined
      : undefined;

  Object.assign(schedule, {
    ...updates,
    updatedAt: new Date().toISOString(),
    ...(mediaFiltersString !== undefined && { mediaFilters: mediaFiltersString }),
  });

  await repository.save(schedule);

  return repository.findOne({
    where: { id },
    relations: {
      channel: true,
    },
  });
};

