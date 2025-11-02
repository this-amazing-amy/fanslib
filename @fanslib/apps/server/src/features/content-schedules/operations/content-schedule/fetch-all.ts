import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

export const fetchAllContentSchedules = async (): Promise<ContentSchedule[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);

  return repository.find({
    relations: {
      channel: {
        type: true,
      },
    },
    order: {
      createdAt: "DESC",
    },
  });
};

