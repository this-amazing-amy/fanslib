import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const FetchContentSchedulesByChannelResponseSchema = t.Array(ContentScheduleSchema);

export const fetchContentSchedulesByChannel = async (
  channelId: string
): Promise<typeof FetchContentSchedulesByChannelResponseSchema.static> => {
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

