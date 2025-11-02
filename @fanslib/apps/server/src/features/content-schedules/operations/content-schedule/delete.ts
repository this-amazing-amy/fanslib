import { db } from "../../../../lib/db";
import { ContentSchedule } from "../../entity";

export const deleteContentSchedule = async (id: string): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ContentSchedule);
  await repository.delete({ id });
};

