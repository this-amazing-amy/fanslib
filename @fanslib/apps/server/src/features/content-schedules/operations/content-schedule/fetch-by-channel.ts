import { t } from "elysia";
import { ChannelSchema } from "~/schemas";
import { db } from "../../../../lib/db";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const ContentScheduleWithChannelSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);

export const FetchContentSchedulesByChannelResponseSchema = t.Array(ContentScheduleWithChannelSchema);

export const fetchContentSchedulesByChannel = async (
  channelId: string
): Promise<typeof FetchContentSchedulesByChannelResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.find({
    where: { channelId },
    relations: {
      channel: { type: true, defaultHashtags: true },
    },
    order: {
      createdAt: "DESC",
    },
  });
};

