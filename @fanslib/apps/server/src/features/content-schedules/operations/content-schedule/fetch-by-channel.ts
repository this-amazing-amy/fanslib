import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

export const fetchContentSchedulesByChannel = async (
  channelId: string
): Promise<ContentSchedule[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.find({
    where: { channelId },
    relations: {
      channel: true,
    },
    order: {
      createdAt: "DESC",
    },
  });
};

