import { z } from "zod";
import { db } from "../../../../lib/db";
import { ContentSchedule, ScheduleChannel } from "../../entity";
import { fetchContentScheduleById } from "../content-schedule/fetch-by-id";

export const LinkChannelRequestBodySchema = z.object({
  channelId: z.string(),
});

export const linkChannelToSchedule = async (scheduleId: string, channelId: string) => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const schedule = await scheduleRepo.findOne({ where: { id: scheduleId } });
  if (!schedule) return { error: "not-found" as const };

  const existing = await scheduleChannelRepo.findOne({
    where: { scheduleId, channelId },
  });
  if (existing) return { error: "already-linked" as const };

  const entity = new ScheduleChannel();
  Object.assign(entity, {
    scheduleId,
    channelId,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await scheduleChannelRepo.save(entity);

  return { data: await fetchContentScheduleById(scheduleId) };
};
