import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentSchedule, ContentScheduleSchema } from "../../entity";

export const FetchContentScheduleByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchContentScheduleByIdResponseSchema = t.Composite([
  ContentScheduleSchema,
  t.Object({
    channel: ChannelSchema,
  }),
]);

export const fetchContentScheduleById = async (id: string): Promise<typeof FetchContentScheduleByIdResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.findOne({
    where: { id },
    relations: {
      channel: { type: true, defaultHashtags: true },
    },
  });
};

