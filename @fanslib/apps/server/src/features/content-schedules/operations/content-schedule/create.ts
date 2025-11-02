import type { CreateContentScheduleRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

const stringifyMediaFilters = (filters: Parameters<typeof JSON.stringify>[0]): string =>
  JSON.stringify(filters);

export const createContentSchedule = async (
  data: CreateContentScheduleRequest
): Promise<ContentSchedule> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  const schedule = new ContentSchedule();
  const now = new Date().toISOString();

  const mediaFilters = data.mediaFilters ? stringifyMediaFilters(data.mediaFilters) : undefined;

  Object.assign(schedule, {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    mediaFilters,
  });

  await repository.save(schedule);

  return repository.findOne({
    where: { id: schedule.id },
    relations: {
      channel: true,
    },
  }) as Promise<ContentSchedule>;
};

