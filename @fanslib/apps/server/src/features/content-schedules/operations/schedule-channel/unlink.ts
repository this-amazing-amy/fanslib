import { db } from "../../../../lib/db";
import { ContentSchedule, ScheduleChannel } from "../../entity";
import { fetchContentScheduleById } from "../content-schedule/fetch-by-id";

export const unlinkChannelFromSchedule = async (scheduleId: string, channelId: string) => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const schedule = await scheduleRepo.findOne({ where: { id: scheduleId } });
  if (!schedule) return { error: "not-found" as const };

  const existing = await scheduleChannelRepo.findOne({
    where: { scheduleId, channelId },
  });
  if (!existing) return { error: "not-linked" as const };

  await scheduleChannelRepo.remove(existing);

  return { data: await fetchContentScheduleById(scheduleId) };
};
